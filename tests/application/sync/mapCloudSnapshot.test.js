import assert from "node:assert/strict";
import test from "node:test";

import { mapV2Transaction, mapV2TransactionsWithLegacyFallback } from "../../../src/application/sync/mapCloudSnapshot.js";

test("mapeia linha transactions_v2 para lancamento local", () => {
  const transaction = mapV2Transaction(
    {
      id: "tx-1",
      transaction_kind: "expense",
      description: "Mercado",
      amount: "80.50",
      transaction_date: "2026-04-24",
      due_date: "2026-04-30",
      status: "pending",
      payment_method: "credit",
      category_id: "cat-food",
      category_tag_id: "tag-market",
      account_id: "account-main",
      credit_card_id: "card-1",
      created_at: "2026-04-24T10:00:00.000Z",
    },
    {
      categoryById: new Map([["cat-food", { slug: "alimentacao" }]]),
      tagById: new Map([["tag-market", { slug: "mercado" }]]),
      accountById: new Map([["account-main", { name: "Conta corrente" }]]),
    }
  );

  assert.equal(transaction.category, "alimentacao");
  assert.equal(transaction.subcategory, "mercado");
  assert.equal(transaction.account, "Conta corrente");
  assert.equal(transaction.amount, 80.5);
  assert.equal(transaction.paymentMethod, "credit");
});

test("aplica fallback legado quando v2 nao possui categoria ou subcategoria", () => {
  const [transaction] = mapV2TransactionsWithLegacyFallback({
    now: "2026-04-24T12:00:00.000Z",
    rows: [{
      id: "tx-legacy",
      transaction_kind: "",
      description: "Compra antiga",
      amount: 10,
      transaction_date: "2026-04-24",
      category_id: null,
      category_tag_id: null,
      account_id: null,
    }],
    legacyRows: [{ id: "tx-legacy", cat: "servicos", subcat: "assinatura", type: "expense" }],
    refs: {
      categoryById: new Map(),
      tagById: new Map(),
      accountById: new Map(),
    },
  });

  assert.equal(transaction.category, "servicos");
  assert.equal(transaction.subcategory, "assinatura");
  assert.equal(transaction.type, "expense");
  assert.equal(transaction.createdAt, "2026-04-24T12:00:00.000Z");
});
