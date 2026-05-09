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

  return {
    closeTransactionModal,
    fillTransactionModal,
    get,
    openTransactionModal,
    readTransactionModalForm,
    setValue,
    value,
  };
}
