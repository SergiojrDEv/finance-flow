import assert from "node:assert/strict";
import test from "node:test";
import {
  renderWalletAccountsHtml,
  renderWalletEmptyStateHtml,
  renderWalletInstitutionsHtml,
  renderWalletInstitutionOptionsHtml,
  renderWalletReviewHtml,
} from "../../src/wallet/viewTemplates.js";

const money = (value) => `R$ ${value}`;

test("renderiza cards de carteira com saldos locais", () => {
  const emptyHtml = renderWalletAccountsHtml([], money);
  const html = renderWalletAccountsHtml([
    { name: "Conta corrente", tone: "checking", caption: "Disponivel", balance: 150 },
  ], money);

  assert.match(emptyHtml, /Adicionar conta/);
  assert.match(emptyHtml, /empty-state-actions/);
  assert.match(html, /wallet-account-card checking/);
  assert.match(html, /Conta corrente/);
  assert.match(html, /Saldo acompanhado no app/);
  assert.match(html, /R\$ 150/);
});

test("renderiza instituicoes e cartoes em modo local", () => {
  const html = renderWalletInstitutionsHtml([
    { id: "conn-1", institutionId: "nubank", name: "Nubank", balance: 1000, accountBalance: 1200, creditBalance: 200 },
  ], [
    { name: "Cartao principal", caption: "Fecha dia 25", amount: 300 },
  ], money);

  assert.match(html, /Nubank/);
  assert.match(html, /data-wallet-disconnect="conn-1"/);
  assert.match(html, /Cartao principal/);
  assert.match(html, /R\$ 300/);
});

test("renderiza pendencias de revisao da carteira", () => {
  const html = renderWalletReviewHtml({ imported: 1, matched: 2, manualAccounts: 3 });

  assert.match(html, /Transacoes importadas/);
  assert.match(html, /Casamentos automaticos/);
  assert.match(html, /Contas locais/);
  assert.match(html, />3</);
});

test("renderiza transacoes importadas pendentes com acao de conferencia", () => {
  const html = renderWalletReviewHtml({}, [
    { id: "imp-1", description: "Uber", date: "2026-05-08", type: "expense", amount: 23.4 },
  ], money);

  assert.match(html, /Uber/);
  assert.match(html, /Importado do banco/);
  assert.match(html, /data-wallet-create-transaction="imp-1"/);
  assert.match(html, /Criar lancamento/);
  assert.match(html, /data-wallet-review-imported="imp-1"/);
  assert.match(html, /Conferido/);
});

test("renderiza estado vazio e opcoes de bancos", () => {
  const emptyHtml = renderWalletEmptyStateHtml();
  const optionsHtml = renderWalletInstitutionOptionsHtml([
    { id: "nubank", name: "Nubank", color: "#8a05be", mark: "N" },
  ]);

  assert.match(emptyHtml, /Nenhum banco conectado ainda/);
  assert.match(emptyHtml, /wallet-empty-connect-bank/);
  assert.match(emptyHtml, /Open Finance regulado/);
  assert.match(optionsHtml, /data-wallet-bank="nubank"/);
});
