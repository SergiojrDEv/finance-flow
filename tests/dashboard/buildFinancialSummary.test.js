import assert from "node:assert/strict";
import test from "node:test";
import { buildFinancialSummary } from "../../src/application/dashboard/buildFinancialSummary.js";

test("calcula disponivel como receitas menos despesas menos investimentos", () => {
  const summary = buildFinancialSummary([
    { type: "income", amount: 3100 },
    { type: "expense", amount: 3314.13, category: "outros" },
    { type: "investment", amount: 100 },
  ]);

  assert.equal(summary.totals.income, 3100);
  assert.equal(summary.totals.expenses, 3314.13);
  assert.equal(summary.totals.investments, 100);
  assert.equal(summary.totals.available, -314.13);
});

test("investimento reduz disponivel mas nao aumenta despesas", () => {
  const summary = buildFinancialSummary([
    { type: "income", amount: 5000 },
    { type: "expense", amount: 1200, category: "moradia" },
    { type: "investment", amount: 800 },
  ]);

  assert.equal(summary.totals.expenses, 1200);
  assert.equal(summary.totals.available, 3000);
  assert.equal(summary.rates.commitmentRate, 40);
  assert.equal(summary.rates.investmentRate, 16);
});

test("sem dados retorna estado vazio sem conclusao falsa", () => {
  const summary = buildFinancialSummary([]);

  assert.equal(summary.totals.available, 0);
  assert.equal(summary.health.score, 0);
  assert.equal(summary.health.status, "empty");
});

test("conta categorias de despesa sem misturar receita e investimento", () => {
  const summary = buildFinancialSummary([
    { type: "income", amount: 2000, category: "salario" },
    { type: "expense", amount: 100, category: "alimentacao" },
    { type: "expense", amount: 50, category: "alimentacao" },
    { type: "expense", amount: 20, category: "transporte" },
    { type: "investment", amount: 300, category: "renda-fixa" },
  ]);

  assert.equal(summary.counts.income, 1);
  assert.equal(summary.counts.expenseCategories, 2);
  assert.equal(summary.counts.investments, 1);
});
