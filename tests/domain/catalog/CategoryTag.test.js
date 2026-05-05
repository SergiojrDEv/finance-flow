import assert from "node:assert/strict";
import test from "node:test";
import { CategoryTag } from "../../../src/domain/catalog/CategoryTag.js";

test("cria etiqueta imutavel ligada a categoria", () => {
  const result = CategoryTag.create({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: " restaurante ",
    name: " Restaurante ",
    color: "#c43d4b",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.slug, "restaurante");
  assert.equal(result.value.name, "Restaurante");
  assert.equal(Object.isFrozen(result.value), true);
});

test("recusa etiqueta invalida", () => {
  const result = CategoryTag.create({
    kind: "expense",
    categorySlug: "",
    slug: "",
    name: "",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.categorySlug, "Categoria principal e obrigatoria.");
});
