import assert from "node:assert/strict";
import test from "node:test";
import { Goal } from "../../../src/domain/goals/Goal.js";

test("cria meta imutavel normalizada", () => {
  const result = Goal.create({
    name: " Reserva ",
    key: "renda-fixa",
    target: "30000.239",
    currentAmount: "1000.1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Reserva");
  assert.equal(result.value.target, 30000.24);
  assert.equal(result.value.currentAmount, 1000.1);
  assert.equal(Object.isFrozen(result.value), true);
});

test("recusa meta invalida", () => {
  const result = Goal.create({ name: "", key: "", target: 0 });

  assert.equal(result.ok, false);
  assert.equal(result.errors.target, "Valor alvo deve ser maior que zero.");
});
