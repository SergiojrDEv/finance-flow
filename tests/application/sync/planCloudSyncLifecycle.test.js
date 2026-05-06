import assert from "node:assert/strict";
import test from "node:test";
import {
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
