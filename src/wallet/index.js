import { buildWalletOverview } from "../application/wallet/buildWalletOverview.js";
import { buildImportedTransactionDraft } from "../application/openfinance/buildImportedTransactionDraft.js";
import { MOCK_INSTITUTIONS } from "../infrastructure/openfinance/MockOpenFinanceProvider.js";
import {
  renderWalletAccountsHtml,
  renderWalletEmptyStateHtml,
  renderWalletInstitutionsHtml,
  renderWalletInstitutionOptionsHtml,
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
      openFinance: deps.state.openFinance,
      currentDate: deps.state.currentDate,
    });

    setText("#wallet-patrimony", deps.formatter.format(overview.patrimony));
    setText("#wallet-available", deps.formatter.format(overview.available));
    setText("#wallet-investments", deps.formatter.format(overview.investments));
    setText("#wallet-credit-in-use", deps.formatter.format(overview.creditCardInUse));
    setText("#wallet-connected-count", `${overview.institutionRows.length} instituicao${overview.institutionRows.length === 1 ? "" : "es"}`);
    setHtml("#wallet-account-cards", renderWalletAccountsHtml(overview.accountCards, deps.formatter.format));
    setHtml("#wallet-openfinance-empty-slot", overview.hasOpenFinance ? "" : renderWalletEmptyStateHtml());
    setHtml("#wallet-institution-list", renderWalletInstitutionsHtml(overview.institutionRows, overview.creditCardRows, deps.formatter.format));
    setHtml("#wallet-review-list", renderWalletReviewHtml(overview.review, overview.pendingImported, deps.formatter.format));
    setHtml("#wallet-bank-options", renderWalletInstitutionOptionsHtml(MOCK_INSTITUTIONS));
  }

  function openWalletBankModal() {
    document.querySelector("#wallet-bank-modal-overlay")?.classList.remove("is-hidden");
    document.body.classList.add("modal-open");
  }

  function closeWalletBankModal() {
    document.querySelector("#wallet-bank-modal-overlay")?.classList.add("is-hidden");
    document.body.classList.remove("modal-open");
  }

  async function connectMockBank(institutionId) {
    const userId = deps.state.currentUser?.id || "local-user";
    const connectionResult = await deps.openFinanceServices.connectInstitution.execute({ userId, institutionId });
    if (!connectionResult.ok) {
      deps.notify?.("Nao foi possivel conectar este banco.");
      return;
    }

    await deps.openFinanceServices.importTransactions.execute(connectionResult.value.id);
    deps.persist();
    closeWalletBankModal();
    deps.renderAll();
    deps.notify?.("Banco conectado em modo mock.");
  }

  async function disconnectMockBank(connectionId) {
    await deps.openFinanceServices.importedTransactionRepository.deleteByConnection(connectionId);
    await deps.openFinanceServices.connectionRepository.deleteById(connectionId);
    deps.persist();
    deps.renderAll();
    deps.notify?.("Banco desconectado.");
  }

  async function reviewImportedTransaction(importedTransactionId) {
    const result = await deps.openFinanceServices.reviewImportedTransaction.execute(importedTransactionId);
    if (!result.ok) {
      deps.notify?.("Nao foi possivel marcar esta transacao.");
      return;
    }

    deps.persist();
    deps.renderAll();
    deps.notify?.("Transacao importada marcada como conferida.");
  }

  async function createTransactionFromImported(importedTransactionId) {
    const importedTransaction = await deps.openFinanceServices.importedTransactionRepository.findById(importedTransactionId);
    const draftResult = buildImportedTransactionDraft({
      importedTransaction,
      settings: deps.state.settings,
      userId: deps.state.currentUser?.id || "local-user",
    });

    if (!draftResult.ok) {
      deps.notify?.("Nao foi possivel encontrar esta transacao importada.");
      return;
    }

    const transactionResult = await deps.createTransactionFromDraft(draftResult.value);
    if (!transactionResult.ok) return;

    await deps.openFinanceServices.reviewImportedTransaction.execute(importedTransactionId, {
      matchedTransactionId: transactionResult.value.id,
    });
    deps.persist();
    deps.renderAll();
    deps.notify?.("Lancamento criado a partir do banco.");
  }

  return {
    closeWalletBankModal,
    connectMockBank,
    createTransactionFromImported,
    disconnectMockBank,
    openWalletBankModal,
    renderWallet,
    reviewImportedTransaction,
  };
}
