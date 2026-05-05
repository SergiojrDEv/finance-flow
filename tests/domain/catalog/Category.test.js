import assert from "node:assert/strict";
import test from "node:test";
import { Category } from "../../../src/domain/catalog/Category.js";

test("cria categoria de despesa imutavel", () => {
  const result = Category.create({
    kind: "expense",
    slug: "pets",
    name: " Pets ",
    color: "#0b7285",
    monthlyLimit: 200,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Pets");
  assert.equal(result.value.monthlyLimit, 200);
  assert.equal(Object.isFrozen(result.value), true);
});

test("categoria de receita nao guarda limite mensal", () => {
  const result = Category.create({
    kind: "income",
    slug: "bonus",
    name: "Bonus",
    color: "#168a5b",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.monthlyLimit, null);
});
