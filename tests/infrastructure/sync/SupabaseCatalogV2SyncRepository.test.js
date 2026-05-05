import assert from "node:assert/strict";
import test from "node:test";

import { SupabaseCatalogV2SyncRepository } from "../../../src/infrastructure/sync/SupabaseCatalogV2SyncRepository.js";

function createQueryResult(result, calls) {
  const query = {
    select(columns) {
      calls.push({ method: "select", columns });
      return query;
    },
    eq(column, value) {
      calls.push({ method: "eq", column, value });
      return query;
    },
    in(column, values) {
      calls.push({ method: "in", column, values });
      return result;
    },
    then(resolve) {
      return Promise.resolve(result).then(resolve);
    },
  };
  return query;
}

function createClient(data = {}) {
  const calls = [];
  const selectQueues = {
    accounts: [
      data.accounts || [],
    ],
    categories: [
      data.categories || [],
      data.freshCategories || data.categories || [],
    ],
    category_tags: [
      data.categoryTags || [],
    ],
    credit_cards: [
      data.creditCards || [],
    ],
    budgets: [
      data.budgets || [],
    ],
    goals: [
      data.goals || [],
    ],
  };

  const client = {
    from(table) {
      calls.push({ method: "from", table });
      return {
        upsert(rows, options) {
          calls.push({ method: "upsert", table, rows, options });
          return Promise.resolve({ error: null });
        },
        insert(row) {
          calls.push({ method: "insert", table, row });
          return Promise.resolve({ error: null });
        },
        update(payload) {
          calls.push({ method: "update", table, payload });
          return createQueryResult({ error: null }, calls);
        },
        delete() {
          calls.push({ method: "delete", table });
          return createQueryResult({ error: null }, calls);
        },
        select(columns) {
          calls.push({ method: "select", table, columns });
          const queue = selectQueues[table] || [[]];
          const rows = queue.length > 1 ? queue.shift() : queue[0];
          return createQueryResult({ data: rows, error: null }, calls);
        },
      };
    },
    calls,
  };
  return client;
}

test("sincroniza catalogo v2 e retorna referencias para lancamentos", async () => {
  const client = createClient({
    accounts: [{ id: "account-main", name: "Conta corrente" }, { id: "account-old", name: "Antiga" }],
    categories: [
      { id: "cat-food", kind: "expense", slug: "food" },
      { id: "cat-fixed", kind: "investment", slug: "renda-fixa" },
      { id: "cat-old", kind: "expense", slug: "old" },
    ],
    freshCategories: [
      { id: "cat-food", kind: "expense", slug: "food", color: "#cc3344" },
      { id: "cat-fixed", kind: "investment", slug: "renda-fixa", color: "#635bff" },
    ],
    categoryTags: [{ id: "tag-old", category_id: "cat-food", slug: "old" }],
    creditCards: [{ id: "card-old" }],
    budgets: [{ id: "budget-food", category_id: "cat-food", period_kind: "monthly" }],
    goals: [{ id: "goal-fixed", name: "Reserva", linked_category_id: "cat-fixed" }],
  });
  const repository = new SupabaseCatalogV2SyncRepository({
    client,
    inferAccountKind: () => "checking",
  });

  const refs = await repository.sync({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    catalog: {
      accounts: [{ name: "Conta corrente" }],
      categories: [
        { kind: "expense", slug: "food", name: "Alimentacao", monthlyLimit: 900, color: "#cc3344" },
        { kind: "investment", slug: "renda-fixa", name: "Renda fixa" },
      ],
      tags: [{ kind: "expense", categorySlug: "food", slug: "market", name: "Mercado" }],
      creditCards: [{ id: "card-main", name: "Principal" }],
      budgets: [{ categorySlug: "food", periodKind: "monthly", amount: 900 }],
      goals: [{ key: "renda-fixa", name: "Reserva", target: 30000, currentAmount: 1000 }],
    },
  });

  const upsertTables = client.calls.filter((call) => call.method === "upsert").map((call) => call.table);
  const updateTables = client.calls.filter((call) => call.method === "update").map((call) => call.table);

  assert.deepEqual(upsertTables, ["accounts", "categories", "category_tags", "credit_cards"]);
  assert.equal(updateTables.includes("accounts"), true);
  assert.equal(updateTables.includes("categories"), true);
  assert.equal(updateTables.includes("category_tags"), true);
  assert.equal(updateTables.includes("credit_cards"), true);
  assert.equal(updateTables.includes("budgets"), true);
  assert.equal(updateTables.includes("goals"), true);
  assert.equal(refs.accounts.get("conta corrente"), "account-main");
  assert.equal(refs.categories.get("expense:food").id, "cat-food");
  assert.equal(refs.tags.get("cat-food:market").name, "Mercado");
});

test("exige dependencias obrigatorias", async () => {
  assert.throws(() => new SupabaseCatalogV2SyncRepository(), /client e obrigatorio/);

  const repository = new SupabaseCatalogV2SyncRepository({ client: createClient() });
  await assert.rejects(
    () => repository.sync({ catalog: {} }),
    /userId e obrigatorio/
  );
  await assert.rejects(
    () => repository.sync({ userId: "user-1" }),
    /catalog e obrigatorio/
  );
});
