import { SUPABASE_FALLBACK_CONFIG, state } from "../core/state.js";
import {
  parseAuthHashType,
  planAuthStateChange,
  planInitialAuthSession,
} from "../application/auth/AuthSessionService.js";
import {
  applyCloudPullResult,
} from "../application/sync/applyCloudPullResult.js";
import { buildCloudStatusText } from "../application/sync/buildCloudStatusText.js";
import {
  applyCloudSyncCompletion,
  applyCloudSyncStart,
  hasUnsyncedLocalChanges as detectUnsyncedLocalChanges,
  planCloudSyncCompletion,
  planCloudSyncStart,
} from "../application/sync/planCloudSyncLifecycle.js";
import { planCloudConnectionSetup } from "../application/sync/planCloudConnectionSetup.js";
import { planCloudUserRequirement } from "../application/sync/planCloudUserRequirement.js";
import {
  fetchSupabaseConfig,
  loadSupabaseConfig as resolveSupabaseConfig,
} from "../infrastructure/config/SupabaseConfigProvider.js";
import { createSyncServices } from "../infrastructure/composition/createSyncServices.js";
import { pullCloudSync } from "../infrastructure/sync/CloudPullSyncService.js";
import { pushCloudSync } from "../infrastructure/sync/CloudPushSyncService.js";

export function createSupabaseModule(deps) {
  function getAuthHashType() {
    return parseAuthHashType(location.hash);
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
    badge.textContent = buildCloudStatusText({
      forcedText,
      cloudReady: state.cloudReady,
      isSyncing: state.isSyncing,
      userEmail: state.currentUser?.email,
    });
  }

  function requireCloudUser() {
    const requirement = planCloudUserRequirement({
      hasClient: Boolean(state.supabaseClient),
      hasUser: Boolean(state.currentUser),
    });
    if (!requirement.ok) {
      const message = requirement.errors?.client
        ? "Conexao com Supabase indisponivel. Atualize a pagina."
        : "Entre com sua conta antes de sincronizar.";
      deps.notify(message);
    }
    return requirement.ok;
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

  function handleCloudError(error) {
    state.isSyncing = false;
    renderCloudStatus();
    deps.notify(error.message || "Erro ao sincronizar Supabase.");
  }

  async function hasV2Schema() {
    const services = createSyncServices({ client: state.supabaseClient });
    return services.schemaRepository.hasTransactionsV2();
  }

  async function applyAuthSessionPlan(plan) {
    if (plan.shouldSignOut) await state.supabaseClient.auth.signOut();
    state.isPasswordRecovery = plan.isPasswordRecovery;
    state.currentUser = plan.currentUser;
    if (plan.view) deps.showAuthView(plan.view);
    deps.renderAuthGate(plan.authGateMessage || undefined);
    renderCloudStatus();
    if (plan.shouldSaveProfile) await saveUserProfileFromMetadata(state.currentUser);
    if (plan.shouldPull) await pullFromSupabase({ silent: true });
  }

  async function syncToSupabase() {
    const startPlan = planCloudSyncStart({
      hasUser: Boolean(state.currentUser),
      hasClient: Boolean(state.supabaseClient),
      isSyncing: state.isSyncing,
    });
    const startResult = applyCloudSyncStart(state, startPlan);
    if (!startResult.started) return;
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

    const completionPlan = planCloudSyncCompletion({
      pendingCloudSync: state.pendingCloudSync,
    });
    const completionResult = applyCloudSyncCompletion(state, completionPlan);
    deps.save();
    renderCloudStatus();
    if (completionResult.shouldRunAgain) {
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
    const applied = applyCloudPullResult(state, result, {
      syncSettingsFromCatalog: deps.syncSettingsFromCatalog,
    });
    if (applied.skipped) {
      renderCloudStatus();
      return;
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

    const runtimePlan = planCloudConnectionSetup({
      hasRuntimeFactory: Boolean(window.supabase),
      hasConfig: true,
    });
    if (!runtimePlan.ok) {
      renderCloudStatus(runtimePlan.statusText);
      deps.renderAuthGate(runtimePlan.authGateMessage);
      return false;
    }

    const config = await loadSupabaseConfig();
    const configPlan = planCloudConnectionSetup({
      hasRuntimeFactory: true,
      hasConfig: Boolean(config?.url && config?.anonKey),
    });
    if (!configPlan.ok) {
      renderCloudStatus(configPlan.statusText);
      deps.renderAuthGate(configPlan.authGateMessage);
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
    const initialPlan = planInitialAuthSession({
      user: data.session?.user,
      isPasswordRecovery: state.isPasswordRecovery,
      isEmailConfirmed: deps.isEmailConfirmed,
    });
    await applyAuthSessionPlan(initialPlan);
    if (initialPlan.action === "password-recovery") return true;

    state.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const plan = planAuthStateChange({
        event,
        user: session?.user,
        isPasswordRecovery: state.isPasswordRecovery,
        isEmailConfirmed: deps.isEmailConfirmed,
      });
      if (plan.action === "ignore") return;
      await applyAuthSessionPlan(plan);
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
    handleCloudError,
    syncToSupabase,
    pullFromSupabase,
    initSupabase,
    ensureSupabaseReady,
  };
}
