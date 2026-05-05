import assert from "node:assert/strict";
import test from "node:test";

import { buildDashboardInsights } from "../../../src/application/dashboard/buildDashboardInsights.js";

test("monta alertas de vencimento e orcamento", () => {
  const insights = buildDashboardInsights({
    today: new Date("2026-04-24T12:00:00.000Z"),
    expenseCategories: [["alimentacao", "Alimentacao", "#c43d4b", 100]],
    budgetRules: { alimentacao: { monthly: 100 } },
    totals: { income: 1000, investment: 50 },
    transactions: [
      { status: "pending", dueDate: "2026-04-24", description: "Internet", amount: 120 },
      { type: "expense", category: "alimentacao", amount: 85 },
    ],
  });

  assert.deepEqual(insights.map((item) => [item.kind, item.label]), [
    ["due", "Vence hoje"],
    ["budget", "Perto do limite"],
  ]);
  assert.equal(insights[1].amount, 85);
  assert.equal(insights[1].threshold, 100);
});

test("inclui insight de investimento quando passa de dez por cento da renda", () => {
  const insights = buildDashboardInsights({
    totals: { income: 1000, investment: 150 },
  });

  assert.equal(insights[0].kind, "investment");
  assert.equal(insights[0].investmentRate, 15);
});
