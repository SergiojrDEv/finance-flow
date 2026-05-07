import assert from "node:assert/strict";
import test from "node:test";
import { planCloudError } from "../../../src/application/sync/planCloudError.js";

test("planeja efeitos de erro de sincronizacao", () => {
  const plan = planCloudError({ message: "Falha remota" });

  assert.equal(plan.shouldStopSyncing, true);
  assert.equal(plan.shouldRenderStatus, true);
  assert.equal(plan.shouldNotify, true);
  assert.equal(plan.message, "Falha remota");
});

test("normaliza mensagem ausente sem escolher texto de infraestrutura", () => {
  const plan = planCloudError({ message: "   " });

  assert.equal(plan.message, "");
});
