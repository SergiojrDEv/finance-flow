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

  return {
    focus,
    get,
    getAll,
    hideModal,
    html,
    numberValue,
    reset,
    setHidden,
    setValue,
    showModal,
    text,
    value,
  };
}
