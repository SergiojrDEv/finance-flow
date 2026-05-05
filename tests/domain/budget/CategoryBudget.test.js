import assert from "node:assert/strict";
import test from "node:test";
import { CategoryBudget } from "../../../src/domain/budget/CategoryBudget.js";

test("cria orcamento de categoria imutavel", () => {
  const result = CategoryBudget.create({
    categorySlug: " alimentacao ",
    weeklyLimit: "350.555",
    monthlyLimit: 1400,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.categorySlug, "alimentacao");
  assert.equal(result.value.weeklyLimit, 350.56);
  assert.equal(Object.isFrozen(result.value), true);
});

test("recusa orcamento invalido", () => {
  const result = CategoryBudget.create({
    categorySlug: "",
    weeklyLimit: -1,
    monthlyLimit: 0,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.categorySlug, "Categoria e obrigatoria.");
});
