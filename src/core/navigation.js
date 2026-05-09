export const LAST_SECTION_KEY = "finance-flow-last-section";
export const VALID_SECTIONS = new Set(["visao-geral", "carteira", "novo-lancamento", "orcamentos", "metas", "relatorios", "ajustes"]);

export function createNavigationModule({
  state,
  documentRef = document,
  locationRef = location,
  storage = localStorage,
} = {}) {
  function setTransactionView(view) {
    state.transactionView = view === "month" ? "month" : "compose";
    documentRef.body.dataset.transactionView = state.transactionView;
    documentRef.querySelectorAll("[data-transaction-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.transactionView === state.transactionView);
    });
  }

  function setSectionFromHash() {
    const savedSection = storage.getItem(LAST_SECTION_KEY);
    const rawId = locationRef.hash.replace("#", "") || (VALID_SECTIONS.has(savedSection) ? savedSection : "visao-geral");
    const id = rawId === "lancamentos" || rawId === "lancamentos-mes" ? "novo-lancamento" : rawId;
    if (rawId === "lancamentos-mes") setTransactionView("month");
    if (id === "novo-lancamento" && !documentRef.body.dataset.transactionView) setTransactionView(state.transactionView || "compose");
    documentRef.body.dataset.section = id;
    if (VALID_SECTIONS.has(id)) storage.setItem(LAST_SECTION_KEY, id);
    documentRef.querySelectorAll(".section").forEach((section) => {
      section.classList.toggle("active", section.id === id);
    });
    documentRef.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === id);
    });
  }

  return {
    setSectionFromHash,
    setTransactionView,
  };
}
