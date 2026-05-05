import assert from "node:assert/strict";
import test from "node:test";
import { validateCategoryBudgetDraft } from "../../src/application/budget/validateCategoryBudgetDraft.js";

test("aceita orcamento com limites zero", () => {
  const result = validateCategoryBudgetDraft({
    categorySlug: "alimentacao",
    weeklyLimit: 0,
    monthlyLimit: 0,
  });

  assert.equal(result.valid, true);
});

test("recusa categoria vazia", () => {
  const result = validateCategoryBudgetDraft({
    categorySlug: "",
    weeklyLimit: 10,
    monthlyLimit: 100,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.categorySlug, "Categoria e obrigatoria.");
});

test("recusa limites negativos", () => {
  const result = validateCategoryBudgetDraft({
    categorySlug: "alimentacao",
    weeklyLimit: -1,
    monthlyLimit: -10,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.weeklyLimit, "Limite semanal nao pode ser negativo.");
  assert.equal(result.errors.monthlyLimit, "Limite mensal nao pode ser negativo.");
});
