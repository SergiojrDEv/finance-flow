import assert from "node:assert/strict";
import test from "node:test";
import {
  clearShadowDiagnostics,
  listShadowDiagnostics,
  recordShadowDiagnostic,
} from "../../../src/infrastructure/diagnostics/shadowDiagnostics.js";

test("registra diagnostico estruturado de shadow mode", () => {
  clearShadowDiagnostics();

  const event = recordShadowDiagnostic({
    scope: "transaction-create",
    details: { divergences: [{ field: "amount" }] },
    now: () => new Date("2026-04-24T12:00:00.000Z"),
  });

  assert.equal(event.type, "shadow");
  assert.equal(event.scope, "transaction-create");
  assert.equal(event.createdAt, "2026-04-24T12:00:00.000Z");
  assert.equal(listShadowDiagnostics().length, 1);
});

test("sanitiza erros antes de armazenar", () => {
  clearShadowDiagnostics();

  recordShadowDiagnostic({
    scope: "transaction-create",
    details: { error: new TypeError("falha controlada") },
    now: () => new Date("2026-04-24T12:00:00.000Z"),
  });

  const [event] = listShadowDiagnostics();
  assert.deepEqual(event.details.error, {
    name: "TypeError",
    message: "falha controlada",
  });
});

test("mantem apenas os ultimos 100 eventos", () => {
  clearShadowDiagnostics();

  for (let index = 0; index < 105; index += 1) {
    recordShadowDiagnostic({
      scope: "transaction-create",
      details: { index },
      now: () => new Date(2026, 3, 24, 12, 0, index),
    });
  }

  const events = listShadowDiagnostics();
  assert.equal(events.length, 100);
  assert.equal(events[0].details.index, 5);
});
