import { els, state } from "./state.js";
import {
  clone,
  esc,
  getBudgetRule,
  getCategory,
  getCategoryColorFromList,
  getSubcategories,
  getSubcategoryLabel,
  mergeBudgetRules,
  mergeSubcategories,
  monthKey,
  parseLocalDate,
  toDateInput,
} from "./utils.js";
import { createStorageModule } from "./storage.js";
import { createUiModule } from "./ui.js";
import { createNavigationModule } from "./navigation.js";
import { bindAppEvents } from "./events.js";
import { createDashboardModule } from "../dashboard/index.js";
import { createTransactionsModule } from "../transactions/index.js";
import { createSettingsModule } from "../settings/index.js";
import { createAuthModule } from "../auth/index.js";
import { createSupabaseModule } from "../supabase/index.js";
import { installDiagnosticsApi } from "../infrastructure/diagnostics/installDiagnosticsApi.js";

export function createFinanceFlowRuntime({ windowRef = window } = {}) {
  const deps = {
    els,
    state,
    clone,
    esc,
    getCategory,
    getSubcategoryLabel,
    mergeBudgetRules,
    mergeSubcategories,
    monthKey,
    parseLocalDate,
    toDateInput,
    getBudgetRule,
    getSubcategories,
    getCategoryColorFromList,
  };

  Object.assign(deps, createUiModule(deps));
  Object.assign(deps, createNavigationModule(deps));
  Object.assign(deps, createStorageModule(deps));
  state.settings = deps.mergeSettings();
  state.catalog = deps.hydrateCatalog(state.settings, state.catalog);
  Object.assign(deps, createTransactionsModule(deps));
  Object.assign(deps, createSettingsModule(deps));
  Object.assign(deps, createDashboardModule(deps));
  Object.assign(deps, createAuthModule(deps));
  Object.assign(deps, createSupabaseModule(deps));
  installDiagnosticsApi(windowRef);

  return { deps, state };
}

export async function startFinanceFlow(runtime = createFinanceFlowRuntime()) {
  const { deps } = runtime;

  deps.load();
  deps.setDefaultDate();
  deps.setActiveType("expense");
  deps.updateAccountOptions();
  deps.updateCreditCardOptions();
  deps.updateCreditPaymentFields();
  deps.setupPwaSupport();
  bindAppEvents(runtime);
  deps.setTransactionView(state.transactionView);
  deps.setSectionFromHash();
  deps.renderAll();
  state.supabaseInitPromise = deps.initSupabase();
  await state.supabaseInitPromise;

  return runtime;
}
