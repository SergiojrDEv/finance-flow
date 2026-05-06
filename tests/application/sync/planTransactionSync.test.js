import assert from "node:assert/strict";
import test from "node:test";

import { mapTransactionToV2Row, planTransactionV2Sync } from "../../../src/application/sync/planTransactionSync.js";

test("mapeia lancamento local para linha transactions_v2", () => {
  const now = "2026-04-24T12:00:00.000Z";
  const row = mapTransactionToV2Row(
    {
      id: "tx-1",
      type: "expense",
      status: "pending",
      description: "Supermercado",
      amount: "123.45",
      date: "2026-04-24",
      dueDate: "2026-04-30",
      category: "Alimentacao",
      subcategory: "Mercado",
      account: "Conta corrente",
      paymentMethod: "credit",
      createdAt: "2026-04-24T10:00:00.000Z",
    },
    {
      userId: "user-1",
      now,
      categories: new Map([["expense:Alimentacao", { id: "cat-food" }]]),
      tagIds: new Map([["cat-food:Mercado", "tag-market"]]),
      accounts: new Map([["conta corrente", "account-main"]]),
    }
  );

  assert.deepEqual(row, {
    id: "tx-1",
    user_id: "user-1",
    transaction_kind: "expense",
    status: "pending",
    description: "Supermercado",
    amount: 123.45,
    transaction_date: "2026-04-24",
    due_date: "2026-04-30",
    category_id: "cat-food",
    category_tag_id: "tag-market",
    account_id: "account-main",
    credit_card_id: null,
    payment_method: "credit",
    recurring_rule_id: null,
    installment_group_id: null,
    installment_number: null,
    installment_total: null,
    created_at: "2026-04-24T10:00:00.000Z",
    updated_at: now,
  });
});

test("usa padroes seguros quando campos opcionais nao existem", () => {
  const row = mapTransactionToV2Row(
    {
      id: "tx-2",
      type: "income",
      description: "Salario",
      amount: 3100,
      date: "2026-04-24",
      category: "Salario",
    },
    {
      userId: "user-1",
      now: "2026-04-24T12:00:00.000Z",
      categories: new Map(),
      tagIds: new Map(),
      accounts: new Map(),
    }
  );

  assert.equal(row.status, "paid");
  assert.equal(row.due_date, "2026-04-24");
  assert.equal(row.payment_method, "pix");
  assert.equal(row.category_id, null);
  assert.equal(row.account_id, null);
});

test("normaliza tipo antigo antes de enviar para transactions_v2", () => {
  const row = mapTransactionToV2Row(
    {
      id: "tx-legacy",
      transaction_kind: "investment",
      description: "Tesouro",
      amount: 100,
      date: "2026-04-24",
      category: "Renda fixa",
    },
    {
      userId: "user-1",
      categories: new Map([["investment:Renda fixa", { id: "cat-fixed" }]]),
      tagIds: new Map(),
      accounts: new Map(),
      now: "2026-04-24T12:00:00.000Z",
    }
  );

  assert.equal(row.transaction_kind, "investment");
  assert.equal(row.category_id, "cat-fixed");
});

test("usa despesa como fallback quando tipo esta ausente ou invalido", () => {
  const row = mapTransactionToV2Row(
    {
      id: "tx-missing-kind",
      description: "Lancamento antigo",
      amount: 50,
      date: "2026-04-24",
      category: "Outros",
    },
    { userId: "user-1", categories: new Map(), tagIds: new Map(), accounts: new Map() }
  );

  assert.equal(row.transaction_kind, "expense");
});

test("planeja upserts locais e exclusoes remotas sem tocar no Supabase", () => {
  const result = planTransactionV2Sync({
    localTransactions: [
      { id: "tx-1", type: "expense", description: "Mercado", amount: 10, date: "2026-04-24" },
      { id: "tx-2", type: "income", description: "Salario", amount: 100, date: "2026-04-24" },
      { type: "expense", description: "Sem id", amount: 5, date: "2026-04-24" },
    ],
    remoteTransactions: [{ id: "tx-1" }, { id: "tx-old" }, {}],
    refs: {
      userId: "user-1",
      now: "2026-04-24T12:00:00.000Z",
      categories: new Map(),
      tagIds: new Map(),
      accounts: new Map(),
    },
  });

  assert.deepEqual(result.upserts.map((item) => item.id), ["tx-1", "tx-2"]);
  assert.deepEqual(result.deletes, ["tx-old"]);
});
