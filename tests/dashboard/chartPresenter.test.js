import assert from "node:assert/strict";
import test from "node:test";

import { buildCashflowChartView } from "../../src/dashboard/chartPresenter.js";

test("monta configuracao do grafico de fluxo sem depender do DOM", () => {
  const view = buildCashflowChartView([
    { label: "mar.", income: 100, expense: 80, free: 20 },
    { label: "abr.", income: 100, expense: 120, free: -20 },
  ]);

  assert.equal(view.status, "Saldo negativo");
  assert.equal(view.config.type, "line");
  assert.deepEqual(view.config.data.labels, ["mar.", "abr."]);
  assert.deepEqual(view.config.data.datasets[0].data, [100, 100]);
  assert.deepEqual(view.config.data.datasets[1].data, [80, 120]);
  assert.deepEqual(view.config.data.datasets[2].data, [20, -20]);
});

test("monta status positivo para serie vazia", () => {
  const view = buildCashflowChartView([]);

  assert.equal(view.status, "Saldo positivo");
  assert.deepEqual(view.config.data.labels, []);
});
