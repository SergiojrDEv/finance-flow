export function createTransactionsDom(documentRef = document) {
  function get(selector) {
    return documentRef.querySelector(selector);
  }

  function value(selector, fallback = "") {
    return get(selector)?.value ?? fallback;
  }

  function setValue(selector, nextValue) {
    const target = get(selector);
    if (target) target.value = nextValue;
  }

  function text(selector, nextValue) {
    const target = get(selector);
    if (target) target.textContent = nextValue;
  }

  function setHidden(selector, hidden) {
    const target = get(selector);
    if (!target) return;
    target.classList.toggle("is-hidden", hidden);
    target.hidden = hidden;
  }

  function html(selector, nextValue) {
    const target = get(selector);
    if (target) target.innerHTML = nextValue;
  }

  function getAll(selector) {
    return [...documentRef.querySelectorAll(selector)];
  }

  function showModal(selector) {
    get(selector)?.classList.remove("is-hidden");
    documentRef.body?.classList.add("modal-open");
  }

  function hideModal(selector) {
    get(selector)?.classList.add("is-hidden");
    documentRef.body?.classList.remove("modal-open");
  }

  function reset(selector) {
    get(selector)?.reset();
  }

  function focus(selector) {
    get(selector)?.focus();
  }

  function fillTransactionModal(item) {
    setValue("#transaction-modal-description", item.description);
    setValue("#transaction-modal-category", item.category);
    setValue("#transaction-modal-account", item.account);
    setValue("#transaction-modal-amount", item.amount);
    setValue("#transaction-modal-date", item.date);
    setValue("#transaction-modal-due-date", item.dueDate || item.date);
    setValue("#transaction-modal-status", item.status || "paid");
    setValue("#transaction-modal-payment-method", item.paymentMethod || "pix");
    setValue("#transaction-modal-credit-card", item.creditCardId || "");
  }

  function openTransactionModal() {
    showModal("#transaction-modal-overlay");
    focus("#transaction-modal-description");
  }

  function closeTransactionModal() {
    reset("#transaction-modal-form");
    hideModal("#transaction-modal-overlay");
  }

  function readTransactionModalForm() {
    return {
      description: value("#transaction-modal-description"),
      category: value("#transaction-modal-category"),
      subcategory: value("#transaction-modal-subcategory"),
      account: value("#transaction-modal-account"),
      amount: value("#transaction-modal-amount"),
      date: value("#transaction-modal-date"),
      dueDate: value("#transaction-modal-due-date"),
      status: value("#transaction-modal-status"),
      paymentMethod: value("#transaction-modal-payment-method"),
      creditCardId: value("#transaction-modal-credit-card"),
    };
  }

  function readTransactionForm(formOrData) {
    const formData = typeof formOrData?.get === "function" ? formOrData : new FormData(formOrData);
    return {
      description: formData.get("description"),
      category: formData.get("category"),
      subcategory: formData.get("subcategory"),
      account: formData.get("account"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      dueDate: formData.get("dueDate"),
      status: formData.get("status"),
      paymentMethod: formData.get("paymentMethod"),
      creditCardId: formData.get("creditCardId"),
      recurrence: formData.get("recurrence"),
      repeatCount: formData.get("repeatCount"),
      installments: formData.get("installments"),
    };
  }

  function resetTransactionForm(form) {
    form?.reset();
  }

  function setDefaultDueDate(value) {
    setValue("#due-date", value);
  }

  function syncCreditCardOptions(optionsHtml) {
    html("#credit-card", optionsHtml);
    html("#transaction-modal-credit-card", optionsHtml);
  }

  function syncCreditPaymentFields({ isExpense, isCredit }) {
    setHidden("#credit-card-field", !isExpense || !isCredit);
    setHidden("#installments-field", !isExpense || !isCredit);
    if (!isExpense || !isCredit) {
      setValue("#credit-card", "");
      setValue("#installments", 1);
    }
  }

  function readPaymentMethod() {
    return value("#payment-method");
  }

  function syncTransactionModalCreditFields({ isExpense, isCredit }) {
    setHidden("#transaction-modal-credit-card-field", !isExpense || !isCredit);
    if (!isExpense || !isCredit) {
      setValue("#transaction-modal-credit-card", "");
    }
  }

  function readTransactionModalPaymentMethod() {
    return value("#transaction-modal-payment-method");
  }

  function syncTransactionModalCategories(optionsHtml) {
    html("#transaction-modal-category", optionsHtml);
  }

  function syncTransactionModalAccounts(optionsHtml, fallback) {
    const account = get("#transaction-modal-account");
    if (!account) return;
    const previousValue = account.value;
    account.innerHTML = optionsHtml;
    account.value = optionsHtml.includes(`value="${previousValue}"`) ? previousValue : fallback;
  }

  function readTransactionModalCategory() {
    return value("#transaction-modal-category");
  }

  function syncSubcategoryOptions({ fieldSelector, selectSelector, optionsHtml, preferredValue, visible }) {
    setHidden(fieldSelector, !visible);
    const select = get(selectSelector);
    if (!select) return;
    select.innerHTML = visible ? optionsHtml : "";
    select.value = visible && optionsHtml.includes(`value="${preferredValue}"`) ? preferredValue : "";
  }

  function syncTransactionModalSegments(type) {
    getAll(".transaction-modal-segment").forEach((button) => {
      button.classList.toggle("active", button.dataset.modalType === type);
    });
  }

  function syncTransactionSegments(type) {
    getAll(".segment").forEach((button) => {
      button.classList.toggle("active", button.dataset.type === type);
    });
  }

  function showImportPreview(htmlContent) {
    html("#import-preview", htmlContent);
    setHidden("#import-preview", false);
  }

  function clearImportPreview() {
    html("#import-preview", "");
    setHidden("#import-preview", true);
  }

  function syncTransactionTypeFields({ isExpense, experience, defaultPaymentMethod }) {
    text("#transaction-form-title", experience.formTitle);
    text("#transaction-form-copy", experience.formCopy);
    text("#transaction-hero-title", experience.heroTitle);
    text("#transaction-hero-copy", experience.heroCopy);
    text("#transaction-submit", experience.submitLabel);
    ["#transaction-payment-row", "#transaction-recurrence-row", "#repeat-count-field"].forEach((selector) => {
      setHidden(selector, !isExpense);
    });

    if (!isExpense) {
      setValue("#payment-method", defaultPaymentMethod);
      setValue("#credit-card", "");
      setValue("#installments", 1);
      setValue("#recurrence", "none");
      setValue("#repeat-count", 1);
      setValue("#subcategory", "");
    }
  }

  function syncTransactionModalTypeFields({ isExpense, experience, defaultPaymentMethod }) {
    text("#transaction-modal-title", experience.modalTitle);
    text("#transaction-modal-copy", experience.modalCopy);
    setHidden("#transaction-modal-payment-row", !isExpense);

    if (!isExpense) {
      setValue("#transaction-modal-payment-method", defaultPaymentMethod);
      setValue("#transaction-modal-subcategory", "");
      setValue("#transaction-modal-credit-card", "");
    }
  }

  function enableTransactionSeriesControls() {
    ["#installments", "#recurrence", "#repeat-count"].forEach((selector) => {
      const target = get(selector);
      if (target) target.disabled = false;
    });
  }

  function hideCancelEdit() {
    get("#cancel-edit")?.classList.add("is-hidden");
  }

  return {
    closeTransactionModal,
    enableTransactionSeriesControls,
    fillTransactionModal,
    get,
    getAll,
    hideCancelEdit,
    clearImportPreview,
    openTransactionModal,
    html,
    readPaymentMethod,
    readTransactionForm,
    readTransactionModalCategory,
    readTransactionModalForm,
    readTransactionModalPaymentMethod,
    setDefaultDueDate,
    setHidden,
    resetTransactionForm,
    setValue,
    syncCreditCardOptions,
    syncCreditPaymentFields,
    syncSubcategoryOptions,
    syncTransactionModalAccounts,
    syncTransactionModalCategories,
    syncTransactionModalCreditFields,
    syncTransactionModalSegments,
    syncTransactionModalTypeFields,
    syncTransactionSegments,
    syncTransactionTypeFields,
    showImportPreview,
    text,
    value,
  };
}
