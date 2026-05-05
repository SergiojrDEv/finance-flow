import assert from "node:assert/strict";
import test from "node:test";
import { buildCashflowSeries } from "../../../src/application/dashboard/buildCashflowSeries.js";

test("monta serie dos ultimos meses com saldo disponivel", () => {
  const series = buildCashflowSeries({
    currentDate: new Date(2026, 3, 24),
    transactions: [
      { date: "2026-02-10", type: "income", amount: 1000 },
      { date: "2026-02-12", type: "expense", amount: 250 },
      { date: "2026-03-01", type: "investment", amount: 100 },
      { date: "2026-04-02", type: "income", amount: 3100 },
      { date: "2026-04-03", type: "expense", amount: 3314.13 },
      { date: "2026-04-04", type: "investment", amount: 50 },
      { date: "2025-12-01", type: "income", amount: 999 },
    ],
  });

  assert.deepEqual(series.map((item) => item.key), [
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
  ]);
  assert.equal(series[1].income, 999);
  assert.equal(series[3].free, 750);
  assert.equal(series[4].free, -100);
  assert.equal(series[5].free, -264.13);
});

test("ignora dados invalidos e respeita quantidade minima de meses", () => {
  const series = buildCashflowSeries({
    currentDate: new Date(2026, 0, 1),
    monthCount: 0,
    transactions: [
      { date: "data-invalida", type: "income", amount: 100 },
      { date: "2026-01-15", type: "income", amount: "200" },
    ],
  });

  assert.equal(series.length, 1);
  assert.equal(series[0].key, "2026-01");
  assert.equal(series[0].income, 200);
  assert.equal(series[0].free, 200);
});
