import assert from "node:assert/strict";
import test from "node:test";
import { validateCategoryDraft } from "../../src/application/catalog/validateCategoryDraft.js";

test("aceita categoria de despesa valida com limite", () => {
  const result = validateCategoryDraft({
    kind: "expense",
    slug: "pets",
    name: "Pets",
    color: "#0b7285",
    monthlyLimit: 200,
  });

  assert.equal(result.valid, true);
});

test("recusa limite mensal em receita", () => {
  const result = validateCategoryDraft({
    kind: "income",
    slug: "bonus",
    name: "Bonus",
    color: "#168a5b",
    monthlyLimit: 100,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.monthlyLimit, "Limite mensal e permitido apenas para despesas.");
});

test("recusa cor invalida", () => {
  const result = validateCategoryDraft({
    kind: "expense",
    slug: "pets",
    name: "Pets",
    color: "azul",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.color, "Cor deve estar no formato hexadecimal.");
});
