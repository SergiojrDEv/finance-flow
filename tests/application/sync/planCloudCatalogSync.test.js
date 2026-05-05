import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAccountRows,
  buildBudgetRows,
  buildCategoryRows,
  buildCreditCardRows,
  buildGoalRows,
  buildTagRows,
  findStaleAccountIds,
  findStaleCategoryIds,
  findStaleCreditCardIds,
  findStaleTagIds,
  isUuid,
  planBudgetSync,
  planGoalSync,
} from "../../../src/application/sync/planCloudCatalogSync.js";

test("monta linhas v2 de contas e detecta contas arquivadas", () => {
  const rows = buildAccountRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    inferAccountKind: () => "wallet",
    accounts: [{ name: "Carteira" }, { name: "Banco", kind: "checking", color: "#123456" }],
  });

  assert.deepEqual(rows, [
    { user_id: "user-1", name: "Carteira", kind: "wallet", color: "#0b7285", is_archived: false, updated_at: "2026-04-24T12:00:00.000Z" },
    { user_id: "user-1", name: "Banco", kind: "checking", color: "#123456", is_archived: false, updated_at: "2026-04-24T12:00:00.000Z" },
  ]);
  assert.deepEqual(findStaleAccountIds({
    localAccounts: [{ name: "Carteira" }],
    remoteAccounts: [{ id: "account-1", name: "carteira" }, { id: "account-old", name: "Antiga" }],
  }), ["account-old"]);
});

test("monta categorias e etiquetas v2 preservando limites e cores", () => {
  const categoryRows = buildCategoryRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    categories: [
      { kind: "expense", slug: "food", name: "Alimentacao", monthlyLimit: 1200, color: "#cc3344" },
      { kind: "income", slug: "salary", name: "Salario", monthlyLimit: 999 },
    ],
  });
  const categoryMap = new Map([
    ["expense:food", { id: "cat-food", color: "#cc3344" }],
    ["income:salary", { id: "cat-salary", color: "#22aa88" }],
  ]);
  const tagRows = buildTagRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    categoryKeyToId: categoryMap,
    tags: [
      { kind: "expense", categorySlug: "food", slug: "market", name: "Mercado" },
      { kind: "expense", categorySlug: "missing", slug: "skip", name: "Ignorar" },
    ],
  });

  assert.equal(categoryRows[0].monthly_limit, 1200);
  assert.equal(categoryRows[1].monthly_limit, null);
  assert.deepEqual(findStaleCategoryIds({
    localCategoryRows: categoryRows,
    remoteCategories: [{ id: "cat-food", kind: "expense", slug: "food" }, { id: "cat-old", kind: "expense", slug: "old" }],
  }), ["cat-old"]);
  assert.deepEqual(tagRows, [{
    user_id: "user-1",
    category_id: "cat-food",
    slug: "market",
    name: "Mercado",
    color: "#cc3344",
    is_archived: false,
    updated_at: "2026-04-24T12:00:00.000Z",
  }]);
  assert.deepEqual(findStaleTagIds({
    localTagRows: tagRows,
    remoteTags: [{ id: "tag-market", category_id: "cat-food", slug: "market" }, { id: "tag-old", category_id: "cat-food", slug: "old" }],
  }), ["tag-old"]);
});

test("monta cartoes, orcamentos e metas v2", () => {
  const categoryMap = new Map([
    ["expense:food", { id: "cat-food" }],
    ["investment:renda-fixa", { id: "cat-fixed" }],
  ]);

  assert.deepEqual(buildCreditCardRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    creditCards: [{ id: "card-1", name: "Principal" }],
  }), [{
    id: "card-1",
    user_id: "user-1",
    name: "Principal",
    color: "#635bff",
    closing_day: 25,
    due_day: 10,
    is_archived: false,
    updated_at: "2026-04-24T12:00:00.000Z",
  }]);
  assert.deepEqual(findStaleCreditCardIds({
    localCreditCards: [{ id: "card-1" }],
    remoteCreditCards: [{ id: "card-1" }, { id: "card-old" }],
  }), ["card-old"]);

  assert.deepEqual(buildBudgetRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    categoryKeyToId: categoryMap,
    budgets: [{ categorySlug: "food", periodKind: "monthly", amount: 900 }],
  })[0], {
    user_id: "user-1",
    category_id: "cat-food",
    categoryId: "cat-food",
    period_kind: "monthly",
    periodKind: "monthly",
    amount: 900,
    starts_on: "2026-04-24",
    updated_at: "2026-04-24T12:00:00.000Z",
  });

  assert.deepEqual(buildGoalRows({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    categoryKeyToId: categoryMap,
    goals: [{ id: "goal-local", key: "renda-fixa", name: "Reserva", target: 30000, currentAmount: 1000 }],
  })[0], {
    id: undefined,
    user_id: "user-1",
    name: "Reserva",
    target_amount: 30000,
    current_amount: 1000,
    linked_category_id: "cat-fixed",
    linkedCategoryId: "cat-fixed",
    color: "#635bff",
    is_archived: false,
    updated_at: "2026-04-24T12:00:00.000Z",
  });
});

test("planeja atualizar e inserir orcamentos sem apagar antes", () => {
  const result = planBudgetSync({
    localBudgets: [
      { categoryId: "cat-food", periodKind: "weekly", amount: 200 },
      { categoryId: "cat-food", periodKind: "monthly", amount: 800 },
    ],
    remoteBudgets: [
      { id: "remote-weekly", categoryId: "cat-food", periodKind: "weekly", amount: 150 },
      { id: "remote-old", categoryId: "cat-old", periodKind: "monthly", amount: 100 },
    ],
  });

  assert.deepEqual(result.upserts.map((item) => item.action), ["update", "insert"]);
  assert.equal(result.upserts[0].remoteId, "remote-weekly");
  assert.deepEqual(result.deletes, ["remote-old"]);
});

test("planeja metas por id remoto valido", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const result = planGoalSync({
    localGoals: [{ id, name: "Reserva", linkedCategoryId: "cat-fixed", targetAmount: 30000 }],
    remoteGoals: [{ id, name: "Reserva antiga", linkedCategoryId: "cat-old" }],
  });

  assert.equal(isUuid(id), true);
  assert.equal(result.upserts[0].action, "update");
  assert.equal(result.upserts[0].remoteId, id);
  assert.deepEqual(result.archives, []);
});

test("planeja metas locais sem uuid por nome e categoria", () => {
  const result = planGoalSync({
    localGoals: [{ id: "goal:renda-fixa:0", name: "Reserva", linkedCategoryId: "cat-fixed", targetAmount: 30000 }],
    remoteGoals: [
      { id: "remote-goal", name: "reserva", linkedCategoryId: "cat-fixed" },
      { id: "remote-stale", name: "Viagem", linkedCategoryId: "cat-funds" },
    ],
  });

  assert.equal(result.upserts[0].action, "update");
  assert.equal(result.upserts[0].remoteId, "remote-goal");
  assert.deepEqual(result.archives, ["remote-stale"]);
});
