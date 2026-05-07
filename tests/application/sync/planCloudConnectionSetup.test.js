import assert from "node:assert/strict";
import test from "node:test";
import { planCloudConnectionSetup } from "../../../src/application/sync/planCloudConnectionSetup.js";

test("recusa iniciar quando runtime de nuvem nao existe", () => {
  const plan = planCloudConnectionSetup({ hasRuntimeFactory: false });

  assert.equal(plan.ok, false);
  assert.equal(plan.errors.runtime, "cloud_runtime_unavailable");
  assert.equal(plan.statusText, "Nuvem indisponivel");
  assert.equal(plan.authGateMessage, "Nao foi possivel conectar agora. Tente novamente em instantes.");
});

test("recusa iniciar quando configuracao publica esta ausente", () => {
  const plan = planCloudConnectionSetup({ hasRuntimeFactory: true, hasConfig: false });

  assert.equal(plan.ok, false);
  assert.equal(plan.errors.config, "cloud_config_missing");
  assert.equal(plan.statusText, "Configure o deploy");
});

test("permite criar cliente quando runtime e configuracao existem", () => {
  const plan = planCloudConnectionSetup({ hasRuntimeFactory: true, hasConfig: true });

  assert.equal(plan.ok, true);
  assert.equal(plan.value.shouldCreateClient, true);
});
