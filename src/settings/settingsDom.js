export function createSettingsDom(documentRef = document) {
  function get(selector) {
    return documentRef.querySelector(selector);
  }

  function getAll(selector) {
    return [...documentRef.querySelectorAll(selector)];
  }

  function value(selector, fallback = "") {
    return get(selector)?.value ?? fallback;
  }

  function numberValue(selector, fallback = 0) {
    return Number(value(selector, fallback));
  }

  function setValue(selector, nextValue) {
    const target = get(selector);
    if (target) target.value = nextValue;
  }

  function text(selector, nextValue) {
    const target = get(selector);
    if (target) target.textContent = nextValue;
  }

  function html(selector, nextValue) {
    const target = get(selector);
    if (target) target.innerHTML = nextValue;
  }

  function setHidden(selector, hidden) {
    const target = get(selector);
    if (!target) return;
    target.classList.toggle("is-hidden", hidden);
    target.hidden = hidden;
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

  function readNewCategoryForm() {
    return {
      type: value("#new-category-type"),
      name: value("#new-category-name").trim(),
      color: value("#new-category-color"),
      limit: numberValue("#new-category-limit"),
    };
  }

  function resetNewCategoryForm(form) {
    form?.reset();
    setValue("#new-category-color", "#0b7285");
  }

  function readNewCardForm() {
    return {
      name: value("#new-card-name").trim(),
      closingDay: numberValue("#new-card-closing"),
      dueDay: numberValue("#new-card-due"),
    };
  }

  function resetNewCardForm(form) {
    form?.reset();
    setValue("#new-card-closing", 25);
    setValue("#new-card-due", 10);
  }

  function readNewSubcategoryForm() {
    return {
      type: value("#new-subcategory-type"),
      categoryKey: value("#new-subcategory-category"),
      name: value("#new-subcategory-name").trim(),
      color: value("#new-subcategory-color"),
    };
  }

  function resetNewSubcategoryForm(form, type) {
    form?.reset();
    setValue("#new-subcategory-type", type);
    setValue("#new-subcategory-color", "#0b7285");
  }

  function readNewGoalForm() {
    return {
      name: value("#new-goal-name").trim(),
      key: value("#new-goal-category"),
      target: numberValue("#new-goal-target"),
    };
  }

  return {
    focus,
    get,
    getAll,
    hideModal,
    html,
    numberValue,
    readNewCardForm,
    readNewCategoryForm,
    readNewGoalForm,
    readNewSubcategoryForm,
    reset,
    resetNewCardForm,
    resetNewCategoryForm,
    resetNewSubcategoryForm,
    setHidden,
    setValue,
    showModal,
    text,
    value,
  };
}
