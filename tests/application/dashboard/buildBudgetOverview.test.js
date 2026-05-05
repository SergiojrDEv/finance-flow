import assert from "node:assert/strict";
import test from "node:test";
import { buildBudgetOverview } from "../../../src/application/dashboard/buildBudgetOverview.js";

test("calcula uso semanal e mensal por categoria", () => {
  const overview = buildBudgetOverview({
    currentDate: new Date(2026, 3, 24),
    today: new Date(2026, 3, 24),
    categories: [
      ["alimentacao", "Alimentacao", "#c43d4b"],
      ["transporte", "Transporte", "#f08c00"],
    ],
    budgetRules: {
      alimentacao: { weekly: 200, monthly: 1000 },
      transporte: { weekly: 50, monthly: 300 },
    },
    transactions: [
      { type: "expense", category: "alimentacao", amount: 100, date: "2026-04-20" },
      { type: "expense", category: "alimentacao", amount: 75, date: "2026-04-24" },
      { type: "expense", category: "alimentacao", amount: 40, date: "2026-04-10" },
      { type: "expense", category: "transporte", amount: 60, date: "2026-04-23" },
      { type: "income", category: "salario", amount: 5000, date: "2026-04-23" },
    ],
  });

  assert.equal(overview[0].used.weekly, 175);
  assert.equal(overview[0].used.monthly, 215);
  assert.equal(overview[0].status.weekly, "88%");
  assert.equal(overview[1].status.weekly, "Limite semanal");
});

test("usa primeiro dia quando mes selecionado nao e o mes atual", () => {
  const overview = buildBudgetOverview({
    currentDate: new Date(2026, 2, 1),
    today: new Date(2026, 3, 24),
    categories: [["moradia", "Moradia", "#0b7285"]],
    budgetRules: { moradia: { weekly: 100, monthly: 1000 } },
    transactions: [
      { type: "expense", category: "moradia", amount: 50, date: "2026-03-01" },
      { type: "expense", category: "moradia", amount: 50, date: "2026-03-09" },
    ],
  });

  assert.equal(overview[0].used.weekly, 50);
  assert.equal(overview[0].used.monthly, 100);
});
