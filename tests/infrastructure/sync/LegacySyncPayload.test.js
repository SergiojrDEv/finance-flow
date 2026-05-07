import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacySyncPayload } from "../../../src/infrastructure/sync/LegacySyncPayload.js";

const fixedNow = () => new Date("2026-04-24T12:00:00.000Z");
const parseLocalDate = (value) => {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
};

test("monta payload legacy completo para sincronizacao", () => {
  const settings = { accounts: ["Conta corrente"] };
  const payload = buildLegacySyncPayload({
    userId: "user-1",
    settings,
    parseLocalDate,
    now: fixedNow,
    transactions: [{
      id: "tx-1",
      type: "expense",
      description: "Mercado",
      category: "alimentacao",
      subcategory: "mercado",
      account: "Carteira",
      amount: "120.50",
      date: "2026-04-23",
      status: "paid",
      paymentMethod: "pix",
    }],
  });

  assert.equal(payload.userId, "user-1");
  assert.equal(payload.settings, settings);
  assert.deepEqual(payload.localIds, ["tx-1"]);
  assert.equal(payload.rows.length, 1);
  assert.equal(payload.rows[0].user_id, "user-1");
  assert.equal(payload.rows[0].descricao, "Mercado");
  assert.equal(payload.rows[0].cat, "alimentacao");
  assert.equal(payload.rows[0].subcat, "mercado");
  assert.equal(payload.rows[0].val, 120.5);
  assert.equal(payload.rows[0].year, 2026);
  assert.equal(payload.rows[0].month, 3);
  assert.equal(payload.rows[0].created_at, "2026-04-24T12:00:00.000Z");
});

test("monta payload legacy vazio preservando settings", () => {
  const settings = { goals: [] };
  const payload = buildLegacySyncPayload({
    userId: "user-1",
    settings,
    parseLocalDate,
    transactions: [],
  });

  assert.deepEqual(payload, {
    userId: "user-1",
    rows: [],
    settings,
    localIds: [],
  });
});

test("exige dependencias obrigatorias", () => {
  assert.throws(
    () => buildLegacySyncPayload({ parseLocalDate }),
    /userId e obrigatorio/
  );
  assert.throws(
    () => buildLegacySyncPayload({ userId: "user-1" }),
    /parseLocalDate e obrigatorio/
  );
});
