import assert from "node:assert/strict";
import test from "node:test";
import { buildMonthTransactionList, normalizeTransactionType } from "../../../src/application/transactions/buildMonthTransactionList.js";

const transactions = [
  {
    id: "tx-1",
    type: "expense",
    description: "Mercado",
    category: "alimentacao",
    subcategory: "mercado",
    account: "Conta corrente",
    paymentMethod: "pix",
    amount: 120,
    date: "2026-05-02",
  },
  {
    id: "tx-2",
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 3100,
    date: "2026-05-05",
  },
  {
    id: "tx-3",
    type: "investment",
    description: "Tesouro",
    category: "renda-fixa",
    account: "Corretora",
    amount: 500,
    date: "2026-04-20",
  },
];

test("lista apenas lancamentos do mes selecionado em ordem recente", () => {
  const list = buildMonthTransactionList({ transactions, monthKey: "2026-05" });

  assert.deepEqual(list.map((item) => item.id), ["tx-2", "tx-1"]);
});

test("filtra por tipo e busca textual", () => {
  const list = buildMonthTransactionList({
    transactions,
    monthKey: "2026-05",
    typeFilter: "expense",
    search: "pix",
  });

  assert.deepEqual(list.map((item) => item.id), ["tx-1"]);
});

test("normaliza dados antigos sem quebrar listagem", () => {
  const list = buildMonthTransactionList({
    transactions: [{ id: "legacy", transaction_kind: "investment", date: "2026-05-10", amount: "10" }, { id: "missing", date: "2026-05-09" }],
    monthKey: "2026-05",
  });

  assert.equal(list[0].type, "investment");
  assert.equal(list[1].type, "expense");
  assert.equal(list[1].description, "");
});

test("usa despesa como tipo defensivo para valores invalidos", () => {
  assert.equal(normalizeTransactionType("foo"), "expense");
  assert.equal(normalizeTransactionType("income"), "income");
});
