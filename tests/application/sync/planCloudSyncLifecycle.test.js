import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCloudSyncCompletion,
  applyCloudSyncStart,
  hasUnsyncedLocalChanges,
  planCloudSyncCompletion,
  planCloudSyncStart,
} from "../../../src/application/sync/planCloudSyncLifecycle.js";

test("detecta mudancas locais ainda nao sincronizadas", () => {
  assert.equal(hasUnsyncedLocalChanges({
    transactions: [{ id: "tx-1" }],
    lastLocalChangeAt: "2026-04-24T12:00:00.000Z",
    lastCloudSyncAt: "2026-04-24T11:00:00.000Z",
  }), true);
  assert.equal(hasUnsyncedLocalChanges({
    transactions: [{ id: "tx-1" }],
    lastLocalChangeAt: "2026-04-24T10:00:00.000Z",
    lastCloudSyncAt: "2026-04-24T11:00:00.000Z",
  }), false);
  assert.equal(hasUnsyncedLocalChanges({
    transactions: [],
    lastLocalChangeAt: "2026-04-24T12:00:00.000Z",
    lastCloudSyncAt: null,
  }), false);
});

test("planeja inicio de sync sem tocar no estado", () => {
  assert.deepEqual(planCloudSyncStart({ hasUser: false, hasClient: true }), {
    shouldStart: false,
    shouldMarkPending: false,
  });
  assert.deepEqual(planCloudSyncStart({ hasUser: true, hasClient: false }), {
    shouldStart: false,
    shouldMarkPending: false,
  });
  assert.deepEqual(planCloudSyncStart({ hasUser: true, hasClient: true, isSyncing: true }), {
    shouldStart: false,
    shouldMarkPending: true,
  });
  assert.deepEqual(planCloudSyncStart({ hasUser: true, hasClient: true, isSyncing: false }), {
    shouldStart: true,
    shouldMarkPending: false,
  });
});

test("planeja conclusao de sync e reexecucao pendente", () => {
  const result = planCloudSyncCompletion({
    pendingCloudSync: true,
    now: () => new Date("2026-04-24T12:00:00.000Z"),
  });

  assert.deepEqual(result, {
    pendingCloudSync: false,
    lastCloudSyncAt: "2026-04-24T12:00:00.000Z",
    shouldRunAgain: true,
  });
});

test("aplica inicio de sync no estado", () => {
  const state = { isSyncing: false, pendingCloudSync: true };
  const result = applyCloudSyncStart(state, { shouldStart: true, shouldMarkPending: false });

  assert.deepEqual(result, { started: true, pending: false });
  assert.equal(state.isSyncing, true);
  assert.equal(state.pendingCloudSync, false);
});

test("marca sync pendente quando ja existe sincronizacao em andamento", () => {
  const state = { isSyncing: true, pendingCloudSync: false };
  const result = applyCloudSyncStart(state, { shouldStart: false, shouldMarkPending: true });

  assert.deepEqual(result, { started: false, pending: true });
  assert.equal(state.isSyncing, true);
  assert.equal(state.pendingCloudSync, true);
});

test("aplica conclusao de sync no estado", () => {
  const state = { isSyncing: true, pendingCloudSync: true, lastCloudSyncAt: null };
  const result = applyCloudSyncCompletion(state, {
    pendingCloudSync: false,
    lastCloudSyncAt: "2026-04-24T12:00:00.000Z",
    shouldRunAgain: true,
  });

  assert.equal(result.shouldRunAgain, true);
  assert.equal(result.state, state);
  assert.equal(state.isSyncing, false);
  assert.equal(state.pendingCloudSync, false);
  assert.equal(state.lastCloudSyncAt, "2026-04-24T12:00:00.000Z");
});

test("exige argumentos para aplicar ciclo de sync", () => {
  assert.throws(() => applyCloudSyncStart(null, {}), /currentState e obrigatorio/);
  assert.throws(() => applyCloudSyncStart({}, null), /startPlan e obrigatorio/);
  assert.throws(() => applyCloudSyncCompletion(null, {}), /currentState e obrigatorio/);
  assert.throws(() => applyCloudSyncCompletion({}, null), /completionPlan e obrigatorio/);
});
