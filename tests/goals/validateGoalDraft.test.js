import assert from "node:assert/strict";
import test from "node:test";
import { validateGoalDraft } from "../../src/application/goals/validateGoalDraft.js";

test("aceita meta valida", () => {
  const result = validateGoalDraft({ name: "Reserva", key: "renda-fixa", target: 30000 });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test("recusa meta sem nome categoria e alvo", () => {
  const result = validateGoalDraft({ name: "", key: "", target: 0 });

  assert.equal(result.valid, false);
  assert.equal(result.errors.name, "Nome da meta e obrigatorio.");
  assert.equal(result.errors.key, "Categoria da meta e obrigatoria.");
  assert.equal(result.errors.target, "Valor alvo deve ser maior que zero.");
});
