import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCloudSnapshotRefs,
  hydrateCloudSnapshot,
  shouldSkipSilentCloudSnapshot,
} from "../../../src/infrastructure/sync/CloudSnapshotHydrator.js";

test("monta refs do snapshot v2 por id", () => {
  const refs = buildCloudSnapshotRefs({
    accounts: [{ id: "account-1", name: "Conta corrente" }],
    categories: [{ id: "cat-1", slug: "alimentacao" }],
    categoryTags: [{ id: "tag-1", slug: "mercado" }],
  });

  assert.equal(refs.accountById.get("account-1").name, "Conta corrente");
  assert.equal(refs.categoryById.get("cat-1").slug, "alimentacao");
  assert.equal(refs.tagById.get("tag-1").slug, "mercado");
});

test("decide quando snapshot silencioso deve ser ignorado", () => {
  assert.equal(shouldSkipSilentCloudSnapshot({
    snapshot: { transactions: [], categories: [] },
    hasLocalTransactions: true,
    silent: true,
  }), true);
  assert.equal(shouldSkipSilentCloudSnapshot({
    snapshot: { transactions: [], categories: [{ id: "cat-1" }] },
    hasLocalTransactions: true,
    silent: true,
  }), false);
  assert.equal(shouldSkipSilentCloudSnapshot({
    snapshot: { transactions: [], categories: [] },
    hasLocalTransactions: true,
    silent: false,
  }), false);
});

test("hidrata catalogo e transacoes locais a partir do snapshot v2", () => {
  const result = hydrateCloudSnapshot({
    accounts: [{ id: "account-1", name: "Conta corrente", kind: "checking" }],
    creditCards: [],
    categories: [{ id: "cat-food", kind: "expense", slug: "alimentacao", name: "Alimentacao", color: "#c43d4b" }],
    categoryTags: [{ id: "tag-market", category_id: "cat-food", slug: "mercado", name: "Mercado", color: "#c43d4b" }],
    budgets: [
      { id: "budget-monthly", category_id: "cat-food", period_kind: "monthly", amount: 1400 },
      { id: "budget-weekly", category_id: "cat-food", period_kind: "weekly", amount: 350 },
    ],
    goals: [],
    transactions: [{
      id: "tx-1",
      transaction_kind: "expense",
      description: "Mercado",
      amount: 80,
      transaction_date: "2026-04-24",
      account_id: "account-1",
      category_id: "cat-food",
      category_tag_id: "tag-market",
      status: "paid",
      payment_method: "pix",
      created_at: "2026-04-24T12:00:00.000Z",
    }],
    legacyTransactions: [],
  });

  assert.equal(result.dataMode, "v2");
  assert.equal(result.catalog.categories[0].slug, "alimentacao");
  assert.equal(result.catalog.tags[0].slug, "mercado");
  assert.equal(result.catalog.budgets.find((item) => item.periodKind === "monthly").amount, 1400);
  assert.deepEqual(result.transactions[0], {
    id: "tx-1",
    type: "expense",
    description: "Mercado",
    amount: 80,
    date: "2026-04-24",
    account: "Conta corrente",
    category: "alimentacao",
    subcategory: "mercado",
    status: "paid",
    dueDate: "2026-04-24",
    paymentMethod: "pix",
    creditCardId: null,
    recurrenceId: null,
    installmentGroup: null,
    installmentNumber: null,
    installmentTotal: null,
    createdAt: "2026-04-24T12:00:00.000Z",
  });
});
