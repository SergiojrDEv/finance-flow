import assert from "node:assert/strict";
import test from "node:test";

import { buildSmartDashboardView, buildSummaryView } from "../../src/dashboard/summaryPresenter.js";

function normalizeSpaces(value) {
  return String(value).replace(/\s/g, " ");
}

const emptyPreviousSummary = {
  totals: { income: 0, expenses: 0, investments: 0, available: 0 },
};

test("monta view do resumo financeiro com textos formatados", () => {
  const view = buildSummaryView({
    transactions: [{ id: "tx-1" }],
    summary: {
      totals: { income: 3100, expenses: 3314.13, investments: 0, available: -214.13 },
      counts: { income: 1, expenseCategories: 12 },
      rates: { investmentRate: 0, commitmentRate: 106.9 },
      health: { score: 33, status: "negative", copy: "nao usado" },
    },
  });

  assert.equal(normalizeSpaces(view.totals.income), "R$ 3.100,00");
  assert.equal(normalizeSpaces(view.totals.available), "-R$ 214,13");
  assert.equal(view.counts.expenseCategories, "12 categorias");
  assert.equal(view.health.score, "33%");
  assert.match(view.health.copy, /Mes no vermelho/);
  assert.match(normalizeSpaces(view.homeBalanceCopy), /R\$ 214,13/);
  assert.deepEqual(view.totalsForInsights, { income: 3100, expense: 3314.13, investment: 0 });
});

test("monta mensagem do dashboard inteligente para mes sem dados", () => {
  const view = buildSmartDashboardView({
    transactions: [],
    totals: { income: 0, expense: 0, investment: 0 },
    free: 0,
    currentDate: new Date(2026, 3, 1),
    today: new Date(2026, 3, 10),
    previousSummary: emptyPreviousSummary,
  });

  assert.equal(view.title, "Seu mes esta em construcao");
  assert.equal(view.monthComparison, "Sem historico");
});

test("monta mensagem do dashboard inteligente para saldo negativo", () => {
  const view = buildSmartDashboardView({
    transactions: [{ id: "tx-1" }],
    totals: { income: 3100, expense: 3314.13, investment: 0 },
    free: -214.13,
    currentDate: new Date(2026, 3, 1),
    today: new Date(2026, 3, 10),
    previousSummary: emptyPreviousSummary,
  });

  assert.equal(view.title, "Atencao ao saldo do mes");
  assert.match(normalizeSpaces(view.copy), /R\$ 214,13/);
});
