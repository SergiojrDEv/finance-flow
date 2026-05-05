import assert from "node:assert/strict";
import test from "node:test";
import { validateCategoryTagDraft } from "../../src/application/catalog/validateCategoryTagDraft.js";

test("aceita etiqueta valida", () => {
  const result = validateCategoryTagDraft({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante",
    color: "#c43d4b",
  });

  assert.equal(result.valid, true);
});

test("recusa etiqueta sem categoria principal", () => {
  const result = validateCategoryTagDraft({
    kind: "expense",
    slug: "restaurante",
    name: "Restaurante",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.categorySlug, "Categoria principal e obrigatoria.");
});

test("recusa tipo e cor invalidos", () => {
  const result = validateCategoryTagDraft({
    kind: "cost",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante",
    color: "vermelho",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.kind, "Tipo da etiqueta invalido.");
  assert.equal(result.errors.color, "Cor deve estar no formato hexadecimal.");
});
