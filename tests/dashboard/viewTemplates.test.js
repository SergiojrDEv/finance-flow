import assert from "node:assert/strict";
import test from "node:test";

globalThis.document = {
  querySelector() {
    return null;
  },
};

const {
  renderBudgetOverviewHtml,
  renderCategoryBreakdownHtml,
  renderDailyHistoryHtml,
  renderEmptyState,
  renderInsightsHtml,
  renderTransactionHighlightsHtml,
} = await import("../../src/dashboard/viewTemplates.js");

test("renderiza estado vazio guiado compartilhado", () => {
  const html = renderEmptyState("Proximo passo", "Cadastre um lancamento para comecar.");

  assert.match(html, /app-empty-state/);
  assert.match(html, /empty-state-title/);
  assert.match(html, /Proximo passo/);
  assert.match(html, /Cadastre um lancamento/);
});

test("dashboard usa estados vazios didaticos", () => {
  const html = [
    renderInsightsHtml([]),
    renderCategoryBreakdownHtml([]),
    renderBudgetOverviewHtml([]),
    renderDailyHistoryHtml([]),
  ].join("\n");

  assert.match(html, /Tudo certo por enquanto/);
  assert.match(html, /Sem despesas no mes/);
  assert.match(html, /Nenhuma categoria para acompanhar/);
  assert.match(html, /Seu historico ainda esta vazio/);
  assert.equal((html.match(/app-empty-state/g) || []).length, 4);
});

test("resumo de lancamentos mostra saldo do mes em linguagem de app", () => {
  const html = renderTransactionHighlightsHtml({
    count: 3,
    status: { paid: 2, pending: 1 },
    payments: { pix: 2, credit: 1 },
    totals: { income: 1000, outflow: 1200, balance: -200 },
  });

  assert.match(html, /Movimento do mes/);
  assert.match(html, /Falta no mes/);
  assert.match(html, /Forma mais usada/);
  assert.match(html, /R\$\s*200,00/);
});
