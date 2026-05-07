import assert from "node:assert/strict";
import test from "node:test";
import {
  planCloudReadiness,
  planCloudReadinessAfterInit,
} from "../../../src/application/sync/planCloudReadiness.js";

test("nao inicia novamente quando cliente ja existe", () => {
  const plan = planCloudReadiness({ hasClient: true, hasInitPromise: false });

  assert.equal(plan.ok, true);
  assert.equal(plan.value.shouldCreateInitPromise, false);
  assert.equal(plan.value.shouldWaitInit, false);
});

test("cria promessa de inicializacao quando cliente ainda nao existe", () => {
  const plan = planCloudReadiness({ hasClient: false, hasInitPromise: false });

  assert.equal(plan.ok, true);
  assert.equal(plan.value.shouldCreateInitPromise, true);
  assert.equal(plan.value.shouldWaitInit, true);
});

test("reaproveita promessa de inicializacao em andamento", () => {
  const plan = planCloudReadiness({ hasClient: false, hasInitPromise: true });

  assert.equal(plan.ok, true);
  assert.equal(plan.value.shouldCreateInitPromise, false);
  assert.equal(plan.value.shouldWaitInit, true);
});

test("recusa readiness quando inicializacao nao entregou cliente pronto", () => {
  const failed = planCloudReadinessAfterInit({ isReady: false, hasClient: false });
  const missingClient = planCloudReadinessAfterInit({ isReady: true, hasClient: false });

  assert.equal(failed.ok, false);
  assert.equal(failed.errors.readiness, "cloud_unavailable");
  assert.equal(missingClient.ok, false);
});

test("confirma readiness depois da inicializacao pronta", () => {
  const plan = planCloudReadinessAfterInit({ isReady: true, hasClient: true });

  assert.deepEqual(plan, { ok: true, value: {} });
});
