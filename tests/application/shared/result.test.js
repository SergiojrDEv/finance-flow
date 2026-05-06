import assert from "node:assert/strict";
import test from "node:test";
import { fail, firstErrorMessage, ok } from "../../../src/application/shared/result.js";

test("cria resultado de sucesso padronizado", () => {
  assert.deepEqual(ok({ id: "tx-1" }), {
    ok: true,
    value: { id: "tx-1" },
  });
});

test("permite metadados em resultado de sucesso", () => {
  assert.deepEqual(ok(["tx-1"], { action: "created" }), {
    ok: true,
    value: ["tx-1"],
    action: "created",
  });
});

test("cria resultado de falha padronizado", () => {
  assert.deepEqual(fail({ amount: "Valor invalido." }), {
    ok: false,
    errors: { amount: "Valor invalido." },
  });
});

test("extrai primeira mensagem de erro com fallback", () => {
  assert.equal(firstErrorMessage({ amount: "Valor invalido." }), "Valor invalido.");
  assert.equal(firstErrorMessage(null, "Falhou."), "Falhou.");
});
