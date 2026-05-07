import assert from "node:assert/strict";
import test from "node:test";
import {
  planCloudPullAfterConfirmation,
  planCloudPullCompletion,
  planCloudPullStart,
} from "../../../src/application/sync/planCloudPull.js";

test("pede confirmacao antes de substituir dados locais no pull manual", () => {
  const plan = planCloudPullStart({
    silent: false,
    hasLocalTransactions: true,
    hasUnsyncedLocalChanges: false,
  });

  assert.equal(plan.action, "confirm-replace");
  assert.equal(plan.shouldAskConfirmation, true);
  assert.equal(plan.shouldContinue, false);
  assert.equal(plan.shouldRenderStatus, false);
});

test("agenda envio local antes do pull silencioso quando existem pendencias", () => {
  const plan = planCloudPullStart({
    silent: true,
    hasLocalTransactions: true,
    hasUnsyncedLocalChanges: true,
  });

  assert.equal(plan.action, "sync-local-first");
  assert.equal(plan.shouldScheduleAutoSync, true);
  assert.equal(plan.shouldRenderStatus, true);
  assert.equal(plan.statusText, "Salvando pendencias...");
  assert.equal(plan.shouldContinue, false);
});

test("permite pull manual sem dados locais e exibe status", () => {
  const plan = planCloudPullStart({ silent: false, hasLocalTransactions: false });

  assert.equal(plan.action, "pull");
  assert.equal(plan.shouldContinue, true);
  assert.equal(plan.shouldRenderStatus, true);
  assert.equal(plan.statusText, "Baixando...");
});

test("permite pull silencioso sem poluir status", () => {
  const plan = planCloudPullStart({ silent: true, hasUnsyncedLocalChanges: false });

  assert.equal(plan.action, "pull");
  assert.equal(plan.shouldContinue, true);
  assert.equal(plan.shouldRenderStatus, false);
  assert.equal(plan.statusText, "");
});

test("aplica decisao de confirmacao para pull manual", () => {
  const accepted = planCloudPullAfterConfirmation({ confirmed: true });
  const cancelled = planCloudPullAfterConfirmation({ confirmed: false });

  assert.equal(accepted.action, "pull");
  assert.equal(accepted.shouldContinue, true);
  assert.equal(accepted.statusText, "Baixando...");
  assert.equal(cancelled.action, "cancel");
  assert.equal(cancelled.shouldContinue, false);
});

test("planeja efeitos quando pull foi ignorado", () => {
  const plan = planCloudPullCompletion({ skipped: true, silent: false });

  assert.equal(plan.action, "skipped");
  assert.equal(plan.shouldSave, false);
  assert.equal(plan.shouldRenderStatus, true);
  assert.equal(plan.shouldNotify, false);
});

test("planeja efeitos completos depois de pull manual aplicado", () => {
  const plan = planCloudPullCompletion({ skipped: false, silent: false });

  assert.equal(plan.action, "applied");
  assert.equal(plan.shouldSave, true);
  assert.equal(plan.shouldUpdateOptions, true);
  assert.equal(plan.shouldRenderAll, true);
  assert.equal(plan.shouldRenderStatus, true);
  assert.equal(plan.shouldNotify, true);
});

test("planeja pull silencioso sem notificacao final", () => {
  const plan = planCloudPullCompletion({ skipped: false, silent: true });

  assert.equal(plan.action, "applied");
  assert.equal(plan.shouldSave, true);
  assert.equal(plan.shouldNotify, false);
});
