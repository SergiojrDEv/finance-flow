import { SUPABASE_FALLBACK_CONFIG, state } from "../core/state.js";
import {
  hasUnsyncedLocalChanges as detectUnsyncedLocalChanges,
  planCloudSyncCompletion,
  planCloudSyncStart,
} from "../application/sync/planCloudSyncLifecycle.js";
import {
  fetchSupabaseConfig,
  loadSupabaseConfig as resolveSupabaseConfig,
} from "../infrastructure/config/SupabaseConfigProvider.js";
import { createSyncServices } from "../infrastructure/composition/createSyncServices.js";
import { pullCloudSync } from "../infrastructure/sync/CloudPullSyncService.js";
import { pushCloudSync } from "../infrastructure/sync/CloudPushSyncService.js";
import {
  mapLegacyRowToLocalTransaction,
  mapLocalTransactionToLegacyRow,
  normalizeRemoteDate as normalizeLegacyRemoteDate,
} from "../infrastructure/sync/LegacyTransactionMapper.js";

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
    return detectUnsyncedLocalChanges({
      transactions: state.transactions,
      lastLocalChangeAt: state.lastLocalChangeAt,
      lastCloudSyncAt: state.lastCloudSyncAt,
    });
  }

  async function saveUserProfileFromMetadata(user) {
    if (!state.supabaseClient) return;
    const services = createSyncServices({
      client: state.supabaseClient,
      isEmailConfirmed: deps.isEmailConfirmed,
    });
    await services.userProfileRepository.saveFromMetadata(user);
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
    const services = createSyncServices({ client: state.supabaseClient });
    return services.schemaRepository.hasTransactionsV2();
  }

  async function syncToSupabase() {
    const startPlan = planCloudSyncStart({
      hasUser: Boolean(state.currentUser),
      hasClient: Boolean(state.supabaseClient),
      isSyncing: state.isSyncing,
    });
    if (startPlan.shouldMarkPending) {
      state.pendingCloudSync = true;
      return;
    }
    if (!startPlan.shouldStart) return;
    state.isSyncing = true;
    state.pendingCloudSync = false;
    renderCloudStatus("Salvando...");

    const client = state.supabaseClient;
    const userId = state.currentUser.id;
    const supportsV2 = await hasV2Schema().catch((error) => {
      handleCloudError(error);
      return false;
    });

    try {
      const services = createSyncServices({ client });
      if (supportsV2) deps.syncSettingsFromCatalog();
      const result = await pushCloudSync({
        services,
        userId,
        supportsV2,
        catalog: state.catalog,
        transactions: state.transactions,
        settings: state.settings,
        parseLocalDate: deps.parseLocalDate,
        hydrateCatalog: deps.hydrateCatalog,
      });
      if (result.catalog) state.catalog = result.catalog;
    } catch (error) {
      handleCloudError(error);
      return;
    }

    state.isSyncing = false;
    const completionPlan = planCloudSyncCompletion({
      pendingCloudSync: state.pendingCloudSync,
    });
    state.lastCloudSyncAt = completionPlan.lastCloudSyncAt;
    state.pendingCloudSync = completionPlan.pendingCloudSync;
    deps.save();
    renderCloudStatus();
    if (completionPlan.shouldRunAgain) {
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

    let result;
    try {
      const services = createSyncServices({ client: state.supabaseClient });
      result = await pullCloudSync({
        services,
        userId: state.currentUser.id,
        supportsV2,
        silent: options.silent,
        hasLocalTransactions: Boolean(state.transactions.length),
        currentCatalog: state.catalog,
        mergeSettings: deps.mergeSettings,
        hydrateCatalog: deps.hydrateCatalog,
      });
    } catch (error) {
      return handleCloudError(error);
    }
    if (result.skipped) {
      renderCloudStatus();
      return;
    }

    const hydrated = result.hydrated;
    state.transactions = hydrated.transactions;
    if (result.shouldSyncSettingsFromCatalog) {
      state.catalog = hydrated.catalog;
      state.dataMode = hydrated.dataMode;
      deps.syncSettingsFromCatalog();
    } else if (hydrated.hasSettings) {
      state.settings = hydrated.settings;
      state.catalog = hydrated.catalog;
      state.dataMode = hydrated.dataMode;
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
