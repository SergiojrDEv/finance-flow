import assert from "node:assert/strict";
import test from "node:test";
import {
  mapLegacyRowToLocalTransaction,
  mapLocalTransactionToLegacyRow,
  normalizeRemoteDate,
} from "../../../src/infrastructure/sync/LegacyTransactionMapper.js";

const fixedNow = () => new Date("2026-04-24T12:00:00.000Z");
const parseLocalDate = (value) => {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
};

test("normaliza datas remotas em formatos aceitos", () => {
  assert.equal(normalizeRemoteDate("2026-04-23T10:00:00.000Z"), "2026-04-23");
  assert.equal(normalizeRemoteDate("23/04/2026"), "2026-04-23");
  assert.equal(normalizeRemoteDate(null, 2026, 3), "2026-04-01");
  assert.equal(normalizeRemoteDate(null, null, null, { now: fixedNow }), "2026-04-24");
});

test("mapeia lancamento local para linha legacy do Supabase", () => {
  const row = mapLocalTransactionToLegacyRow({
    id: "tx-1",
    type: "expense",
    description: "Mercado",
    category: "alimentacao",
    subcategory: "mercado",
    account: "",
    amount: "120.50",
    date: "2026-04-23",
    status: "",
  }, {
    userId: "user-1",
    parseLocalDate,
    now: fixedNow,
  });

  assert.equal(row.user_id, "user-1");
  assert.equal(row.descricao, "Mercado");
  assert.equal(row.cat, "alimentacao");
  assert.equal(row.account, "Conta corrente");
  assert.equal(row.status, "paid");
  assert.equal(row.payment_method, "pix");
  assert.equal(row.val, 120.5);
  assert.equal(row.year, 2026);
  assert.equal(row.month, 3);
  assert.equal(row.created_at, "2026-04-24T12:00:00.000Z");
});

test("mapeia linha legacy para lancamento local", () => {
  const transaction = mapLegacyRowToLocalTransaction({
    id: "tx-1",
    type: "income",
    descricao: "Salario",
    cat: "salario",
    subcat: "fixo",
    val: "3100",
    date: "23/04/2026",
    due_date: null,
    created_at: null,
  }, {
    now: fixedNow,
  });

  assert.deepEqual(transaction, {
    id: "tx-1",
    type: "income",
    description: "Salario",
    category: "salario",
    subcategory: "fixo",
    account: "Conta corrente",
    amount: 3100,
    date: "2026-04-23",
    dueDate: "2026-04-23",
    status: "paid",
    paymentMethod: "pix",
    creditCardId: null,
    recurrenceId: null,
    installmentGroup: null,
    installmentNumber: null,
    installmentTotal: null,
    createdAt: "2026-04-24T12:00:00.000Z",
  });
});

test("exige dependencias para mapear local para legacy", () => {
  assert.throws(() => mapLocalTransactionToLegacyRow({}, { parseLocalDate }), /userId e obrigatorio/);
  assert.throws(() => mapLocalTransactionToLegacyRow({}, { userId: "user-1" }), /parseLocalDate e obrigatorio/);
});
