import { formatCpf, formatPhone } from "./utils.js";

export function openTransactionComposer({
  deps,
  documentRef = document,
  locationRef = location,
  type = "",
} = {}) {
  locationRef.hash = "novo-lancamento";
  deps.setTransactionView("compose");
  if (type) deps.setActiveType(type);
  deps.setSectionFromHash();
  documentRef.querySelector("#description")?.focus();
  documentRef.querySelector("#transaction-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function handleScreenActionClick({
  event,
  button,
  deps,
  documentRef = document,
  locationRef = location,
} = {}) {
  const intent = button?.dataset?.screenActionIntent;

  if (intent === "compose-investment") {
    event?.preventDefault();
    openTransactionComposer({ deps, documentRef, locationRef, type: "investment" });
    return true;
  }

  if (intent === "compose-transaction") {
    event?.preventDefault();
    openTransactionComposer({ deps, documentRef, locationRef });
    return true;
  }

  if (intent === "review-month") {
    event?.preventDefault();
    locationRef.hash = "novo-lancamento";
    deps.setTransactionView("month");
    deps.setSectionFromHash();
    return true;
  }

  return false;
}

export function bindAppEvents({
  deps,
  state,
  documentRef = document,
  windowRef = window,
  locationRef = location,
  confirmRef = confirm,
} = {}) {
  const { els } = deps;

  documentRef.querySelector("#prev-month").addEventListener("click", () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    deps.renderAll();
  });
  documentRef.querySelector("#next-month").addEventListener("click", () => {
    state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
    deps.renderAll();
  });
  documentRef.querySelector("#go-to-new-transaction").addEventListener("click", () => {
    openTransactionComposer({ deps, documentRef, locationRef });
  });
  documentRef.querySelectorAll("[data-quick-type]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openTransactionComposer({ deps, documentRef, locationRef, type: button.dataset.quickType });
    });
  });
  documentRef.querySelectorAll("[data-screen-action-intent]").forEach((button) => {
    button.addEventListener("click", (event) => {
      handleScreenActionClick({ event, button, deps, documentRef, locationRef });
    });
  });
  documentRef.querySelector("#go-to-month-transactions").addEventListener("click", () => {
    locationRef.hash = "novo-lancamento";
    deps.setTransactionView("month");
    deps.setSectionFromHash();
  });
  documentRef.querySelector("#wallet-connect-bank").addEventListener("click", deps.openWalletBankModal);
  documentRef.querySelector("#wallet-bank-modal-close").addEventListener("click", deps.closeWalletBankModal);
  documentRef.querySelector("#wallet-bank-modal-cancel").addEventListener("click", deps.closeWalletBankModal);
  documentRef.querySelector("#wallet-bank-modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "wallet-bank-modal-overlay") deps.closeWalletBankModal();
  });
  documentRef.querySelector("#wallet-bank-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-wallet-bank]");
    if (button) deps.connectMockBank(button.dataset.walletBank);
  });
  documentRef.querySelector("#carteira").addEventListener("click", (event) => {
    if (event.target.closest("#wallet-empty-connect-bank")) deps.openWalletBankModal();
    const disconnectButton = event.target.closest("[data-wallet-disconnect]");
    if (disconnectButton) deps.disconnectMockBank(disconnectButton.dataset.walletDisconnect);
    const createButton = event.target.closest("[data-wallet-create-transaction]");
    if (createButton) deps.createTransactionFromImported(createButton.dataset.walletCreateTransaction);
    const reviewButton = event.target.closest("[data-wallet-review-imported]");
    if (reviewButton) deps.reviewImportedTransaction(reviewButton.dataset.walletReviewImported);
  });
  documentRef.querySelector("#install-app").addEventListener("click", deps.promptInstallApp);
  documentRef.querySelectorAll(".segment").forEach((button) =>
    button.addEventListener("click", () => deps.setActiveType(button.dataset.type))
  );
  els.form.addEventListener("submit", deps.addTransaction);
  documentRef.querySelector("#category-form").addEventListener("submit", deps.addCategory);
  documentRef.querySelector("#account-form").addEventListener("submit", deps.addAccount);
  documentRef.querySelector("#card-form").addEventListener("submit", deps.addCreditCard);
  documentRef.querySelector("#subcategory-form").addEventListener("submit", deps.addSubcategory);
  documentRef.querySelector("#goal-form").addEventListener("submit", deps.addGoal);
  documentRef.querySelector("#login-form").addEventListener("submit", deps.signInSupabase);
  documentRef.querySelector("#login-reset").addEventListener("click", () => {
    documentRef.querySelector("#reset-email").value = documentRef.querySelector("#login-email").value.trim();
    deps.showAuthView("reset");
  });
  documentRef.querySelector("#login-create").addEventListener("click", () => deps.showAuthView("signup"));
  documentRef.querySelector("#signup-back").addEventListener("click", () => deps.showAuthView("login"));
  documentRef.querySelector("#reset-back").addEventListener("click", () => deps.showAuthView("login"));
  documentRef.querySelector("#update-password-back").addEventListener("click", () => {
    locationRef.hash = "";
    deps.showAuthView("login");
  });
  documentRef.querySelector("#signup-form").addEventListener("submit", (event) => {
    event.preventDefault();
    deps.signUpSupabase();
  });
  documentRef.querySelector("#reset-form").addEventListener("submit", deps.requestPasswordReset);
  documentRef.querySelector("#update-password-form").addEventListener("submit", deps.updatePassword);
  documentRef.querySelector("#goal-modal-form").addEventListener("submit", deps.saveGoalFromModal);
  documentRef.querySelector("#goal-modal-close").addEventListener("click", deps.closeGoalModal);
  documentRef.querySelector("#goal-modal-cancel").addEventListener("click", deps.closeGoalModal);
  documentRef.querySelector("#goal-modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "goal-modal-overlay") deps.closeGoalModal();
  });
  documentRef.querySelector("#settings-item-modal-form").addEventListener("submit", deps.saveSettingsItemFromModal);
  documentRef.querySelector("#settings-item-modal-close").addEventListener("click", deps.closeSettingsItemModal);
  documentRef.querySelector("#settings-item-modal-cancel").addEventListener("click", deps.closeSettingsItemModal);
  documentRef.querySelector("#settings-item-modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "settings-item-modal-overlay") deps.closeSettingsItemModal();
  });
  documentRef.querySelector("#transaction-modal-form").addEventListener("submit", deps.saveTransactionFromModal);
  documentRef.querySelector("#transaction-modal-close").addEventListener("click", deps.closeTransactionModal);
  documentRef.querySelector("#transaction-modal-cancel").addEventListener("click", deps.closeTransactionModal);
  documentRef.querySelector("#transaction-modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "transaction-modal-overlay") deps.closeTransactionModal();
  });
  documentRef.querySelectorAll(".transaction-modal-segment").forEach((button) => {
    button.addEventListener("click", () => deps.setTransactionModalType(button.dataset.modalType));
  });
  documentRef.querySelector("#transaction-modal-payment-method").addEventListener("change", deps.updateTransactionModalCreditFields);
  documentRef.querySelector("#transaction-modal-category").addEventListener("change", () => deps.updateTransactionModalSubcategoryOptions());
  documentRef.querySelector("#signup-cpf").addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
  });
  documentRef.querySelector("#signup-phone").addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });
  documentRef.querySelector("#payment-method").addEventListener("change", deps.updateCreditPaymentFields);
  documentRef.querySelector("#category").addEventListener("change", () => deps.updateSubcategoryOptions());
  documentRef.querySelector("#new-subcategory-type").addEventListener("change", deps.renderSubcategoryParentOptions);
  documentRef.querySelector("#logout-btn").addEventListener("click", deps.signOutSupabase);
  documentRef.querySelector("#cancel-edit").addEventListener("click", deps.resetTransactionForm);
  els.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    deps.renderTable();
  });
  els.typeFilter.addEventListener("change", (event) => {
    state.typeFilter = event.target.value;
    deps.renderTable();
  });
  els.table.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove]");
    const editButton = event.target.closest("[data-edit]");
    const paidButton = event.target.closest("[data-paid]");
    if (removeButton) deps.removeTransaction(removeButton.dataset.remove);
    if (editButton) deps.editTransaction(editButton.dataset.edit);
    if (paidButton) deps.markTransactionPaid(paidButton.dataset.paid);
  });
  documentRef.querySelector("#export-csv").addEventListener("click", deps.exportCsv);
  documentRef.querySelector("#export-json").addEventListener("click", deps.exportJson);
  documentRef.querySelector("#clear-data").addEventListener("click", () => {
    if (!confirmRef("Limpar todos os dados salvos neste navegador?")) return;
    state.transactions = [];
    deps.persist();
    deps.renderAll();
    deps.notify("Dados limpos.");
  });
  documentRef.querySelector("#budget-list").addEventListener("submit", (event) => {
    const form = event.target.closest(".budget-rule-form");
    if (form) deps.saveBudgetRule(event);
  });
  documentRef.querySelector("#import-json").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const normalized = deps.normalizeImportedBackup(imported);
      deps.showImportPreview(normalized);
    } catch (error) {
      deps.notify("Nao foi possivel importar este arquivo.");
    } finally {
      event.target.value = "";
    }
  });
  documentRef.querySelector("#import-preview").addEventListener("click", (event) => {
    const button = event.target.closest("[data-import-action]");
    if (!button) return;
    const action = button.dataset.importAction;
    if (action === "cancel") {
      deps.clearImportPreview();
      deps.notify("Importacao cancelada.");
      return;
    }
    deps.applyPendingImport(action);
  });
  documentRef.querySelector("#category-manage-list").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-category]");
    const editButton = event.target.closest("[data-edit-category]");
    if (removeButton) {
      const [type, key] = removeButton.dataset.removeCategory.split(":");
      deps.removeCategory(type, key);
    }
    if (editButton) {
      const [type, key] = editButton.dataset.editCategory.split(":");
      const item = deps.getCategoryRecord(type, key);
      if (!item) return;
      deps.openSettingsItemModal({
        kind: "category",
        kicker: "Categorias",
        title: "Editar categoria",
        type,
        key,
        name: item.name,
        color: item.color,
        limit: deps.getBudgetRule(key).monthly || item.monthlyLimit || 0,
      });
    }
  });
  documentRef.querySelector("#account-manage-list").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-account]");
    const editButton = event.target.closest("[data-edit-account]");
    if (removeButton) deps.removeAccount(Number(removeButton.dataset.removeAccount));
    if (editButton) {
      const index = Number(editButton.dataset.editAccount);
      deps.openSettingsItemModal({
        kind: "account",
        kicker: "Contas",
        title: "Editar conta",
        index,
        name: deps.getAccountRecord(index)?.name || "",
      });
    }
  });
  documentRef.querySelector("#card-manage-list").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-card]");
    const editButton = event.target.closest("[data-edit-card]");
    if (removeButton) deps.removeCreditCard(Number(removeButton.dataset.removeCard));
    if (editButton) {
      const index = Number(editButton.dataset.editCard);
      const card = deps.getCardRecord(index);
      if (!card) return;
      deps.openSettingsItemModal({
        kind: "card",
        kicker: "Cartoes",
        title: "Editar cartao",
        index,
        name: card.name,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
      });
    }
  });
  documentRef.querySelector("#goal-manage-list").addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save-goal]");
    const removeButton = event.target.closest("[data-remove-goal]");
    if (saveButton) {
      deps.updateGoal(Number(saveButton.dataset.saveGoal));
      return;
    }
    if (removeButton) {
      deps.removeGoal(Number(removeButton.dataset.removeGoal));
    }
  });
  documentRef.querySelector("#subcategory-manage-list").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-subcategory]");
    const editButton = event.target.closest("[data-edit-subcategory]");
    if (removeButton) {
      const [type, categoryKey, subKey] = removeButton.dataset.removeSubcategory.split(":");
      deps.removeSubcategory(type, categoryKey, subKey);
    }
    if (editButton) {
      const [type, categoryKey, subKey] = editButton.dataset.editSubcategory.split(":");
      const item = deps.getTagRecord(type, categoryKey, subKey);
      if (!item) return;
      deps.openSettingsItemModal({
        kind: "tag",
        kicker: "Etiquetas",
        title: "Editar etiqueta",
        type,
        categoryKey,
        subKey,
        name: item.name,
        color: item.color || deps.getCategoryColorFromList(type, categoryKey, state.settings.categories),
      });
    }
  });
  documentRef.querySelector("#subcategory-manage-list").addEventListener("submit", (event) => {
    const form = event.target.closest("[data-subcategory-inline]");
    if (!form) return;
    event.preventDefault();
    const [type, categoryKey] = form.dataset.subcategoryInline.split(":");
    const name = new FormData(form).get("name");
    deps.addInlineSubcategory(type, categoryKey, String(name || ""));
  });
  documentRef.querySelector("#settings-manage-switcher").addEventListener("click", (event) => {
    const button = event.target.closest("[data-manage-view]");
    if (!button) return;
    state.manageView = button.dataset.manageView;
    deps.renderManagePanels();
  });
  documentRef.querySelector("#goals-list").addEventListener("click", (event) => {
    const contributeButton = event.target.closest("[data-goal-contribute]");
    const editButton = event.target.closest("[data-goal-edit-card]");
    if (contributeButton) {
      deps.openGoalContribution(Number(contributeButton.dataset.goalContribute));
      return;
    }
    if (editButton) {
      deps.editGoalFromCard(Number(editButton.dataset.goalEditCard));
    }
  });
  windowRef.addEventListener("hashchange", deps.setSectionFromHash);
}
