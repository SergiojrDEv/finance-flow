import {
  getAppRouteIds,
  resolveAppSection,
} from "../application/navigation/appNavigationModel.js";
import { buildAppShellModel } from "../application/navigation/appScreenModel.js";

export const LAST_SECTION_KEY = "finance-flow-last-section";
export const VALID_SECTIONS = new Set(getAppRouteIds());

export function createNavigationModule({
  state,
  documentRef = document,
  locationRef = location,
  storage = localStorage,
} = {}) {
  function setText(selector, value) {
    const target = documentRef.querySelector(selector);
    if (target) target.textContent = value;
  }

  function setAction(selector, action) {
    const target = documentRef.querySelector(selector);
    if (!target) return;

    if (!action) {
      target.classList.add("is-hidden");
      target.removeAttribute("data-screen-action-intent");
      return;
    }

    target.classList.remove("is-hidden");
    target.textContent = action.label;
    target.setAttribute("href", action.href);
    target.dataset.screenActionIntent = action.intent;
  }

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
    const shell = buildAppShellModel({ activeSection: next.sectionId });
    setText("#app-screen-eyebrow", shell.screen.eyebrow);
    setText("#app-screen-title", shell.screen.title);
    setText("#app-screen-description", shell.screen.description);
    setAction("#app-screen-primary-action", shell.screen.primaryAction);
    setAction("#app-screen-secondary-action", shell.screen.secondaryActions[0] || null);
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
