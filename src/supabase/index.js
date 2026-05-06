import { SUPABASE_FALLBACK_CONFIG, state } from "../core/state.js";
import { buildCatalogFromV2, ensureCatalogCoversTransactions } from "../core/catalog.js";
import { mapV2TransactionsWithLegacyFallback } from "../application/sync/mapCloudSnapshot.js";
import {
  fetchSupabaseConfig,
  loadSupabaseConfig as resolveSupabaseConfig,
} from "../infrastructure/config/SupabaseConfigProvider.js";
import { createSyncServices } from "../infrastructure/composition/createSyncServices.js";
import {
  mapLegacyRowToLocalTransaction,
  mapLocalTransactionToLegacyRow,
  normalizeRemoteDate as normalizeLegacyRemoteDate,
} from "../infrastructure/sync/LegacyTransactionMapper.js";
import { isMissingRelationError } from "../infrastructure/sync/SupabaseSyncHelpers.js";

export function createSupabaseModule(deps) {
  function getAuthHashType() {
    const hash = String(location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(hash);
    return params.get("type") || "";
  }

  async function loadSupabaseConfig() {
    return resolveSupabaseConfig({
      explicitConfig: window.FINANCE_FLOW_SUPABASE,
      fetchConfig: (endpoint) => fetchSupabaseConfig(endpoint, { fetchImpl: fetch }),
      fallbackConfig: SUPABASE_FALLBACK_CONFIG,
      logger: console,
    });
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
    return mapLocalTransactionToLegacyRow(item, {
      userId: state.currentUser.id,
      parseLocalDate: deps.parseLocalDate,
    });
  }

  function fromRemoteTransaction(row) {
    return mapLegacyRowToLocalTransaction(row);
  }

  function normalizeRemoteDate(value, year, month) {
    return normalizeLegacyRemoteDate(value, year, month);
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
      const services = createSyncServices({ client });
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

    try {
      const services = createSyncServices({ client });
      await services.legacySyncRepository.sync({
        userId,
        rows: state.transactions.map(toRemoteTransaction),
        settings: state.settings,
        localIds: state.transactions.map((item) => item.id),
      });
    } catch (error) {
      handleCloudError(error);
      return;
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

    const userId = state.currentUser.id;
    let snapshot;
    try {
      const services = createSyncServices({ client: state.supabaseClient });
      snapshot = await services.legacySyncRepository.fetch({ userId });
    } catch (error) {
      return handleCloudError(error);
    }
    const { transactions: txRows, settings } = snapshot;

    if (options.silent && !txRows?.length && state.transactions.length) {
      renderCloudStatus();
      return;
    }

    state.transactions = (txRows || []).map(fromRemoteTransaction);
    if (settings) {
      state.settings = deps.mergeSettings(settings);
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
