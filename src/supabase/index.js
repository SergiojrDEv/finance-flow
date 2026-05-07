import { SUPABASE_FALLBACK_CONFIG, state } from "../core/state.js";
import {
  parseAuthHashType,
  planAuthHashState,
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
  planCloudSyncCompletionEffects,
  planCloudSyncStart,
} from "../application/sync/planCloudSyncLifecycle.js";
import { planCloudConnectionSetup } from "../application/sync/planCloudConnectionSetup.js";
import { planCloudError } from "../application/sync/planCloudError.js";
import {
  planCloudPullAfterConfirmation,
  planCloudPullCompletion,
  planCloudPullStart,
} from "../application/sync/planCloudPull.js";
import {
  planCloudReadiness,
  planCloudReadinessAfterInit,
} from "../application/sync/planCloudReadiness.js";
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
    const errorPlan = planCloudError({ message: error?.message });
    if (errorPlan.shouldStopSyncing) state.isSyncing = false;
    if (errorPlan.shouldRenderStatus) renderCloudStatus();
    if (errorPlan.shouldNotify) deps.notify(errorPlan.message || "Erro ao sincronizar Supabase.");
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
    const completionEffects = planCloudSyncCompletionEffects({
      shouldRunAgain: completionResult.shouldRunAgain,
    });
    if (completionEffects.shouldSave) deps.save();
    if (completionEffects.shouldRenderStatus) renderCloudStatus();
    if (completionEffects.shouldScheduleRunAgain) {
      window.setTimeout(() => syncToSupabase(), 0);
    }
  }

  async function pullFromSupabase(options = {}) {
    if (!requireCloudUser()) return;
    let pullPlan = planCloudPullStart({
      silent: Boolean(options.silent),
      hasLocalTransactions: Boolean(state.transactions.length),
      hasUnsyncedLocalChanges: hasUnsyncedLocalChanges(),
    });
    if (pullPlan.shouldAskConfirmation) {
      pullPlan = planCloudPullAfterConfirmation({
        confirmed: confirm("Substituir os dados locais pelos dados do Supabase?"),
      });
    }
    if (pullPlan.shouldRenderStatus) renderCloudStatus(pullPlan.statusText);
    if (pullPlan.shouldScheduleAutoSync) {
      deps.scheduleAutoSync?.();
      return;
    }
    if (!pullPlan.shouldContinue) return;

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
    const completionPlan = planCloudPullCompletion({
      skipped: applied.skipped,
      silent: Boolean(options.silent),
    });
    if (completionPlan.shouldSave) deps.save();
    if (completionPlan.shouldUpdateOptions) {
      deps.updateCategoryOptions();
      deps.updateAccountOptions();
      deps.updateCreditCardOptions();
    }
    if (completionPlan.shouldRenderAll) deps.renderAll();
    if (completionPlan.shouldRenderStatus) renderCloudStatus();
    if (completionPlan.shouldNotify) deps.notify("Dados baixados do Supabase.");
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

    const hashPlan = planAuthHashState({ authHashType: getAuthHashType() });
    state.isPasswordRecovery = hashPlan.isPasswordRecovery;
    if (hashPlan.view) {
      deps.showAuthView(hashPlan.view);
      deps.renderAuthGate(hashPlan.authGateMessage || undefined);
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
    const readinessPlan = planCloudReadiness({
      hasClient: Boolean(state.supabaseClient),
      hasInitPromise: Boolean(state.supabaseInitPromise),
    });
    if (!readinessPlan.value.shouldWaitInit) return true;
    if (readinessPlan.value.shouldCreateInitPromise) state.supabaseInitPromise = initSupabase();

    const isReady = await state.supabaseInitPromise;
    const afterInitPlan = planCloudReadinessAfterInit({
      isReady,
      hasClient: Boolean(state.supabaseClient),
    });
    if (!afterInitPlan.ok) {
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
