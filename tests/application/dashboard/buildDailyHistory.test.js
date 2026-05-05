import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyHistory } from "../../../src/application/dashboard/buildDailyHistory.js";

test("agrupa historico diario em ordem recente e calcula totais", () => {
  const history = buildDailyHistory([
    { id: "1", date: "2026-04-20", createdAt: "2026-04-20T10:00:00.000Z", type: "expense", amount: 50 },
    { id: "2", date: "2026-04-21", createdAt: "2026-04-21T09:00:00.000Z", type: "income", amount: 1000 },
    { id: "3", date: "2026-04-20", createdAt: "2026-04-20T11:00:00.000Z", type: "investment", amount: 100 },
  ]);

  assert.equal(history.length, 2);
  assert.equal(history[0].date, "2026-04-21");
  assert.equal(history[0].totals.income, 1000);
  assert.equal(history[1].date, "2026-04-20");
  assert.equal(history[1].count, 2);
  assert.equal(history[1].items[0].id, "3");
  assert.equal(history[1].totals.outflow, 150);
});

test("ignora lancamentos sem data", () => {
  const history = buildDailyHistory([{ type: "income", amount: 10 }]);

  assert.deepEqual(history, []);
});
