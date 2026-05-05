import assert from "node:assert/strict";
import test from "node:test";
import { installDiagnosticsApi } from "../../../src/infrastructure/diagnostics/installDiagnosticsApi.js";
import {
  clearShadowDiagnostics,
  recordShadowDiagnostic,
} from "../../../src/infrastructure/diagnostics/shadowDiagnostics.js";

test("instala API tecnica de diagnostico no alvo informado", () => {
  clearShadowDiagnostics();
  const target = {};

  const api = installDiagnosticsApi(target);

  assert.equal(target.financeFlowDiagnostics, api);
  assert.equal(typeof target.financeFlowDiagnostics.shadow.list, "function");
  assert.equal(typeof target.financeFlowDiagnostics.shadow.clear, "function");
});

test("API permite consultar e limpar diagnosticos de shadow", () => {
  clearShadowDiagnostics();
  const target = {};
  installDiagnosticsApi(target);

  recordShadowDiagnostic({
    scope: "transaction-create",
    details: { divergences: [] },
    now: () => new Date("2026-04-24T12:00:00.000Z"),
  });

  assert.equal(target.financeFlowDiagnostics.shadow.list().length, 1);
  target.financeFlowDiagnostics.shadow.clear();
  assert.equal(target.financeFlowDiagnostics.shadow.list().length, 0);
});
