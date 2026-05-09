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
