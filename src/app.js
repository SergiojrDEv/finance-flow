import { els, state } from "./core/state.js";
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
} from "./core/utils.js";
import { createStorageModule } from "./core/storage.js";
import { createUiModule } from "./core/ui.js";
import { createNavigationModule } from "./core/navigation.js";
import { bindAppEvents } from "./core/events.js";
import { createDashboardModule } from "./dashboard/index.js";
import { createTransactionsModule } from "./transactions/index.js";
import { createSettingsModule } from "./settings/index.js";
import { createAuthModule } from "./auth/index.js";
import { createSupabaseModule } from "./supabase/index.js";
import { installDiagnosticsApi } from "./infrastructure/diagnostics/installDiagnosticsApi.js";

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
installDiagnosticsApi(window);

async function init() {
  deps.load();
  deps.setDefaultDate();
  deps.setActiveType("expense");
  deps.updateAccountOptions();
  deps.updateCreditCardOptions();
  deps.updateCreditPaymentFields();
  deps.setupPwaSupport();
  bindAppEvents({ deps, state });
  deps.setTransactionView(state.transactionView);
  deps.setSectionFromHash();
  deps.renderAll();
  state.supabaseInitPromise = deps.initSupabase();
  await state.supabaseInitPromise;
}

init().catch((error) => {
  console.error(error);
  state.currentUser = null;
  state.cloudReady = false;
  deps.renderAuthGate("Nao foi possivel carregar agora. Atualize a pagina.");
});
