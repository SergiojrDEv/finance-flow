import { SUPABASE_FALLBACK_CONFIG, state } from "../core/state.js";
import { buildCatalogFromV2, ensureCatalogCoversTransactions } from "../core/catalog.js";
import { mapV2TransactionsWithLegacyFallback } from "../application/sync/mapCloudSnapshot.js";
import { createSyncServices } from "../infrastructure/composition/createSyncServices.js";

export function createSupabaseModule(deps) {
  function isMissingRelationError(error) {
    const message = String(error?.message || "").toLowerCase();
    return message.includes("does not exist") || message.includes("could not find") || error?.code === "PGRST205";
  }

  function inferAccountKind(name) {
    const lower = String(name || "").toLowerCase();
    if (lower.includes("cartao")) return "credit_card";
    if (lower.includes("corretora")) return "investment";
    if (lower.includes("carteira")) return "wallet";
    if (lower.includes("poupanca")) return "savings";
    return "checking";
  }

  function getAuthHashType() {
    const hash = String(location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(hash);
    return params.get("type") || "";
  }

  async function loadSupabaseConfig() {
    if (window.FINANCE_FLOW_SUPABASE) return window.FINANCE_FLOW_SUPABASE;

    const endpoints = ["/.netlify/functions/config", "/api/config"];
    try {
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) continue;
        const config = await response.json();
        if (config?.url && config?.anonKey) return config;
      }
    } catch (error) {
      console.error("Erro ao carregar config do Supabase", error);
    }
    return SUPABASE_FALLBACK_CONFIG;
  }

  function renderCloudStatus(forcedText) {
    const badge = document.querySelector("#cloud-status");
    if (!badge) return;
    if (forcedText) {
      badge.textContent = forcedText;
      return;
    }
    if (!state.cloudReady) badge.textContent = "Offline";
    else if (state.isSyncing) badge.textContent = "Salvando...";
    else if (state.currentUser?.email) badge.textContent = `Salvo na nuvem: ${state.currentUser.email}`;
    else badge.textContent = "Nao conectado";
  }

  function requireCloudUser() {
    if (!state.supabaseClient) {
      deps.notify("Conexao com Supabase indisponivel. Atualize a pagina.");
      return false;
    }
    if (!state.currentUser) {
      deps.notify("Entre com sua conta antes de sincronizar.");
      return false;
    }
    return true;
  }

  function hasUnsyncedLocalChanges() {
    if (!state.transactions.length) return false;
    if (!state.lastLocalChangeAt) return false;
    if (!state.lastCloudSyncAt) return true;
    return new Date(state.lastLocalChangeAt).getTime() > new Date(state.lastCloudSyncAt).getTime();
  }

  async function saveUserProfileFromMetadata(user) {
    if (!state.supabaseClient || !user?.id || !deps.isEmailConfirmed(user)) return;
    const data = user.user_metadata || {};
    if (!data.full_name && !data.cpf && !data.phone && !data.birthdate) return;

    await state.supabaseClient.from("user_profiles").upsert({
      user_id: user.id,
      full_name: data.full_name || "",
      cpf: data.cpf || "",
      phone: data.phone || "",
      birthdate: data.birthdate || null,
      updated_at: new Date().toISOString(),
    });
  }

  function toRemoteTransaction(item) {
    const date = deps.parseLocalDate(item.date);
    return {
      id: item.id,
      user_id: state.currentUser.id,
      date: item.date,
      descricao: item.description,
      cat: item.category,
      subcat: item.subcategory || null,
      type: item.type,
      val: Number(item.amount),
      account: item.account || "Conta corrente",
      status: item.status || "paid",
      due_date: item.dueDate || item.date,
      payment_method: item.paymentMethod || "pix",
      credit_card_id: item.creditCardId || null,
      recurrence_id: item.recurrenceId || null,
      installment_group: item.installmentGroup || null,
      installment_number: item.installmentNumber || null,
      installment_total: item.installmentTotal || null,
      year: date.getFullYear(),
      month: date.getMonth(),
      created_at: item.createdAt || new Date().toISOString(),
    };
  }

  function fromRemoteTransaction(row) {
    return {
      id: row.id,
      type: row.type,
      description: row.description || row.descricao || "",
      category: row.category || row.cat || "outros",
      subcategory: row.subcategory || row.subcat || null,
      account: row.account || "Conta corrente",
      amount: Number(row.amount ?? row.val ?? 0),
      date: normalizeRemoteDate(row.date, row.year, row.month),
      dueDate: normalizeRemoteDate(row.due_date || row.date, row.year, row.month),
      status: row.status || "paid",
      paymentMethod: row.payment_method || "pix",
      creditCardId: row.credit_card_id || null,
      recurrenceId: row.recurrence_id || null,
      installmentGroup: row.installment_group || null,
      installmentNumber: row.installment_number || null,
      installmentTotal: row.installment_total || null,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  function normalizeRemoteDate(value, year, month) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    if (typeof value === "string" && value.includes("/")) {
      const [day, localMonth, localYear] = value.split("/");
      return `${localYear}-${localMonth.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    if (Number.isInteger(year) && Number.isInteger(month)) {
      return `${year}-${String(month + 1).padStart(2, "0")}-01`;
    }
    return new Date().toISOString().slice(0, 10);
  }

  function handleCloudError(error) {
    state.isSyncing = false;
    renderCloudStatus();
    deps.notify(error.message || "Erro ao sincronizar Supabase.");
  }

  async function hasV2Schema() {
    const { error } = await state.supabaseClient
      .from("transactions_v2")
      .select("id")
      .limit(1);
    if (!error) return true;
    if (isMissingRelationError(error)) return false;
    throw error;
  }

  async function pullFromSupabaseV2(options = {}) {
    const client = state.supabaseClient;
    const userId = state.currentUser.id;

    if (options.silent && hasUnsyncedLocalChanges()) {
      renderCloudStatus("Salvando pendencias...");
      deps.scheduleAutoSync?.();
      return;
    }

    let snapshot;
    try {
      const services = createSyncServices({ client, inferAccountKind, isMissingRelationError });
      snapshot = await services.cloudSnapshotRepository.fetchV2({ userId });
    } catch (error) {
      return handleCloudError(error);
    }

    const {
      accounts,
      creditCards,
      categories,
      categoryTags,
      budgets,
      goals,
      transactions: txRows,
      legacyTransactions: legacyRows,
    } = snapshot;

    if (options.silent && !txRows.length && !categories.length && state.transactions.length) {
      renderCloudStatus();
      return;
    }

    const refs = {
      accountById: new Map(accounts.map((item) => [item.id, item])),
      categoryById: new Map(categories.map((item) => [item.id, item])),
      tagById: new Map(categoryTags.map((item) => [item.id, item])),
    };

    state.catalog = ensureCatalogCoversTransactions(
      buildCatalogFromV2({ accounts, creditCards, categories, categoryTags, budgets, goals }),
      legacyRows
    );
    state.dataMode = "v2";
    deps.syncSettingsFromCatalog();
    state.transactions = mapV2TransactionsWithLegacyFallback({
      rows: txRows,
      legacyRows,
      refs,
    });
    deps.save();
    deps.updateCategoryOptions();
    deps.updateAccountOptions();
    deps.updateCreditCardOptions();
    deps.renderAll();
    renderCloudStatus();
    if (!options.silent) deps.notify("Dados baixados do Supabase.");
  }

  async function syncSettingsToV2(userId) {
    const client = state.supabaseClient;
    const catalog = ensureCatalogCoversTransactions(
      state.catalog || deps.hydrateCatalog(state.settings, state.catalog),
      state.transactions
    );
    state.catalog = catalog;

    const services = createSyncServices({
      client,
      inferAccountKind,
    });
    return services.catalogV2SyncRepository.sync({
      userId,
      catalog,
    });
  }

  async function syncTransactionsToV2(userId, refs) {
    const client = state.supabaseClient;
    const services = createSyncServices({
      client,
      inferAccountKind,
    });
    await services.transactionV2SyncRepository.sync({
      userId,
      transactions: state.transactions,
      refs,
    });
  }

  async function syncToSupabase() {
    if (!state.currentUser || !state.supabaseClient) return;
    if (state.isSyncing) {
      state.pendingCloudSync = true;
      return;
    }
    state.isSyncing = true;
    state.pendingCloudSync = false;
    renderCloudStatus("Salvando...");

    const client = state.supabaseClient;
    const userId = state.currentUser.id;
    const supportsV2 = await hasV2Schema().catch((error) => {
      handleCloudError(error);
      return false;
    });

    if (supportsV2) {
      try {
        deps.syncSettingsFromCatalog();
        const refs = await syncSettingsToV2(userId);
        await syncTransactionsToV2(userId, refs);
      } catch (error) {
        handleCloudError(error);
        return;
      }
    }

    const rows = state.transactions.map(toRemoteTransaction);
    if (rows.length) {
      const { error: upsertTxError } = await client.from("transactions").upsert(rows, { onConflict: "id" });
      if (upsertTxError) {
        handleCloudError(upsertTxError);
        return;
      }
    }

    const { error: settingsError } = await client
      .from("finance_settings")
      .upsert({ user_id: userId, settings: state.settings, updated_at: new Date().toISOString() });
    if (settingsError) {
      handleCloudError(settingsError);
      return;
    }

    const { data: remoteRows, error: remoteRowsError } = await client
      .from("transactions")
      .select("id")
      .eq("user_id", userId);
    if (remoteRowsError) {
      handleCloudError(remoteRowsError);
      return;
    }

    const localIds = new Set(state.transactions.map((item) => item.id));
    const idsToDelete = (remoteRows || []).map((item) => item.id).filter((id) => !localIds.has(id));
    if (idsToDelete.length) {
      const { error: deleteTxError } = await client.from("transactions").delete().eq("user_id", userId).in("id", idsToDelete);
      if (deleteTxError) {
        handleCloudError(deleteTxError);
        return;
      }
    }

    state.isSyncing = false;
    state.lastCloudSyncAt = new Date().toISOString();
    deps.save();
    renderCloudStatus();
    if (state.pendingCloudSync) {
      state.pendingCloudSync = false;
      window.setTimeout(() => syncToSupabase(), 0);
    }
  }

  async function pullFromSupabase(options = {}) {
    if (!requireCloudUser()) return;
    if (!options.silent && state.transactions.length && !confirm("Substituir os dados locais pelos dados do Supabase?")) return;
    if (!options.silent) renderCloudStatus("Baixando...");

    if (options.silent && hasUnsyncedLocalChanges()) {
      renderCloudStatus("Salvando pendencias...");
      deps.scheduleAutoSync?.();
      return;
    }

    const supportsV2 = await hasV2Schema().catch((error) => {
      handleCloudError(error);
      return false;
    });
    if (supportsV2) {
      await pullFromSupabaseV2(options);
      return;
    }

    const client = state.supabaseClient;
    const userId = state.currentUser.id;
    const { data: txRows, error: txError } = await client
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (txError) return handleCloudError(txError);

    const { data: settingsRow, error: settingsError } = await client
      .from("finance_settings")
      .select("settings")
      .eq("user_id", userId)
      .maybeSingle();
    if (settingsError) return handleCloudError(settingsError);

    if (options.silent && !txRows?.length && state.transactions.length) {
      renderCloudStatus();
      return;
    }

    state.transactions = (txRows || []).map(fromRemoteTransaction);
    if (settingsRow?.settings) {
      state.settings = deps.mergeSettings(settingsRow.settings);
      deps.hydrateCatalog(state.settings, state.catalog);
      state.dataMode = "legacy";
    }
    deps.save();
    deps.updateCategoryOptions();
    deps.updateAccountOptions();
    deps.updateCreditCardOptions();
    deps.renderAll();
    renderCloudStatus();
    if (!options.silent) deps.notify("Dados baixados do Supabase.");
  }

  async function initSupabase() {
    if (state.supabaseClient) return true;

    if (!window.supabase) {
      renderCloudStatus("Supabase indisponivel");
      deps.renderAuthGate("Nao foi possivel conectar agora. Tente novamente em instantes.");
      return false;
    }

    const config = await loadSupabaseConfig();
    if (!config?.url || !config?.anonKey) {
      renderCloudStatus("Configure o deploy");
      deps.renderAuthGate("Nao foi possivel conectar agora. Tente novamente em instantes.");
      return false;
    }

    state.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    state.cloudReady = true;

    state.isPasswordRecovery = getAuthHashType() === "recovery";
    if (state.isPasswordRecovery) {
      deps.showAuthView("update-password");
      deps.renderAuthGate("Defina sua nova senha para continuar.");
    }

    const { data } = await state.supabaseClient.auth.getSession();
    if (data.session?.user && !deps.isEmailConfirmed(data.session.user)) {
      await state.supabaseClient.auth.signOut();
      state.currentUser = null;
      deps.renderAuthGate("Confirme seu e-mail antes de entrar.");
      renderCloudStatus();
    } else {
      state.currentUser = data.session?.user || null;
      if (state.isPasswordRecovery) {
        state.currentUser = null;
        deps.renderAuthGate("Defina sua nova senha para continuar.");
        renderCloudStatus();
        return true;
      }
      deps.renderAuthGate();
      renderCloudStatus();
      if (state.currentUser) {
        await saveUserProfileFromMetadata(state.currentUser);
        await pullFromSupabase({ silent: true });
      }
    }

    state.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "PASSWORD_RECOVERY") {
        state.isPasswordRecovery = true;
        state.currentUser = null;
        deps.showAuthView("update-password");
        deps.renderAuthGate("Defina sua nova senha para continuar.");
        renderCloudStatus();
        return;
      }
      if (session?.user && !deps.isEmailConfirmed(session.user)) {
        await state.supabaseClient.auth.signOut();
        state.currentUser = null;
        deps.renderAuthGate("Confirme seu e-mail antes de entrar.");
        renderCloudStatus();
        return;
      }
      if (state.isPasswordRecovery) {
        state.currentUser = null;
        deps.showAuthView("update-password");
        deps.renderAuthGate("Defina sua nova senha para continuar.");
        renderCloudStatus();
        return;
      }
      state.currentUser = session?.user || null;
      deps.renderAuthGate();
      renderCloudStatus();
      if (state.currentUser) await pullFromSupabase({ silent: true });
    });
    return true;
  }

  async function ensureSupabaseReady() {
    if (state.supabaseClient) return true;
    if (!state.supabaseInitPromise) state.supabaseInitPromise = initSupabase();
    const isReady = await state.supabaseInitPromise;
    if (!isReady || !state.supabaseClient) {
      deps.notify("Conexao com Supabase indisponivel. Atualize a pagina.");
      return false;
    }
    return true;
  }

  return {
    loadSupabaseConfig,
    renderCloudStatus,
    requireCloudUser,
    saveUserProfileFromMetadata,
    toRemoteTransaction,
    fromRemoteTransaction,
    normalizeRemoteDate,
    handleCloudError,
    syncToSupabase,
    pullFromSupabase,
    initSupabase,
    ensureSupabaseReady,
  };
}
