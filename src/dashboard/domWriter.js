export function createDashboardDomWriter(documentRef = document) {
  function byId(selector) {
    return documentRef.querySelector(selector);
  }

  function setText(selector, value) {
    const target = byId(selector);
    if (target) target.textContent = value;
  }

  function setHtml(selector, value) {
    const target = byId(selector);
    if (target) target.innerHTML = value;
  }

  function get(selector) {
    return byId(selector);
  }

  return {
    get,
    setText,
    setHtml,
  };
}
