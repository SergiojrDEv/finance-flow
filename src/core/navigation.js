import {
  getAppRouteIds,
  resolveAppSection,
} from "../application/navigation/appNavigationModel.js";

export const LAST_SECTION_KEY = "finance-flow-last-section";
export const VALID_SECTIONS = new Set(getAppRouteIds());

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
    const next = resolveAppSection({ hash: locationRef.hash, savedSection });
    if (next.transactionView) setTransactionView(next.transactionView);
    if (next.sectionId === "novo-lancamento" && !documentRef.body.dataset.transactionView) {
      setTransactionView(state.transactionView || "compose");
    }
    documentRef.body.dataset.section = next.sectionId;
    if (next.shouldPersist) storage.setItem(LAST_SECTION_KEY, next.sectionId);
    documentRef.querySelectorAll(".section").forEach((section) => {
      section.classList.toggle("active", section.id === next.sectionId);
    });
    documentRef.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.section === next.sectionId);
    });
  }

  return {
    setSectionFromHash,
    setTransactionView,
  };
}
