import { buildWalletOverview } from "../application/wallet/buildWalletOverview.js";
import {
  renderWalletAccountsHtml,
  renderWalletInstitutionsHtml,
  renderWalletReviewHtml,
} from "./viewTemplates.js";

export function createWalletModule(deps) {
  function setText(selector, value) {
    const target = document.querySelector(selector);
    if (target) target.textContent = value;
  }

  function setHtml(selector, value) {
    const target = document.querySelector(selector);
    if (target) target.innerHTML = value;
  }

  function renderWallet() {
    const overview = buildWalletOverview({
      settings: deps.state.settings,
      transactions: deps.state.transactions,
      currentDate: deps.state.currentDate,
    });

    setText("#wallet-patrimony", deps.formatter.format(overview.patrimony));
    setText("#wallet-available", deps.formatter.format(overview.available));
    setText("#wallet-investments", deps.formatter.format(overview.investments));
    setHtml("#wallet-account-cards", renderWalletAccountsHtml(overview.accountCards, deps.formatter.format));
    setHtml("#wallet-institution-list", renderWalletInstitutionsHtml(overview.creditCardRows, deps.formatter.format));
    setHtml("#wallet-review-list", renderWalletReviewHtml(overview.review));
  }

  return {
    renderWallet,
  };
}
