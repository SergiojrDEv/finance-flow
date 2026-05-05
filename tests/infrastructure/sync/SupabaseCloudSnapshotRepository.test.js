import assert from "node:assert/strict";
import test from "node:test";

import { SupabaseCloudSnapshotRepository } from "../../../src/infrastructure/sync/SupabaseCloudSnapshotRepository.js";

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
    order(column, options) {
      calls.push({ method: "order", column, options });
      return result;
    },
    then(resolve) {
      return Promise.resolve(result).then(resolve);
    },
  };
  return query;
}

function createClient(results = {}) {
  const calls = [];
  const client = {
    from(table) {
      calls.push({ method: "from", table });
      return createQueryResult(results[table] || { data: [], error: null }, calls);
    },
    calls,
  };
  return client;
}

test("busca snapshot v2 completo do Supabase", async () => {
  const client = createClient({
    accounts: { data: [{ id: "account-1" }], error: null },
    credit_cards: { data: [{ id: "card-1" }], error: null },
    categories: { data: [{ id: "cat-1" }], error: null },
    category_tags: { data: [{ id: "tag-1" }], error: null },
    budgets: { data: [{ id: "budget-1" }], error: null },
    goals: { data: [{ id: "goal-1" }], error: null },
    transactions_v2: { data: [{ id: "tx-1" }], error: null },
    transactions: { data: [{ id: "tx-1", cat: "food" }], error: null },
  });
  const repository = new SupabaseCloudSnapshotRepository({ client });

  const snapshot = await repository.fetchV2({ userId: "user-1" });

  assert.deepEqual(snapshot.accounts, [{ id: "account-1" }]);
  assert.deepEqual(snapshot.creditCards, [{ id: "card-1" }]);
  assert.deepEqual(snapshot.transactions, [{ id: "tx-1" }]);
  assert.deepEqual(snapshot.legacyTransactions, [{ id: "tx-1", cat: "food" }]);
  assert.equal(client.calls.filter((call) => call.method === "from").length, 8);
});

test("ignora erro de relacao ausente apenas na tabela legacy", async () => {
  const client = createClient({
    transactions: { data: null, error: { code: "PGRST205", message: "does not exist" } },
  });
  const repository = new SupabaseCloudSnapshotRepository({
    client,
    isMissingRelationError: (error) => error.code === "PGRST205",
  });

  const snapshot = await repository.fetchV2({ userId: "user-1" });

  assert.deepEqual(snapshot.legacyTransactions, []);
});

test("propaga erro das tabelas principais", async () => {
  const repository = new SupabaseCloudSnapshotRepository({
    client: createClient({ categories: { data: null, error: new Error("falha") } }),
  });

  await assert.rejects(
    () => repository.fetchV2({ userId: "user-1" }),
    /falha/
  );
});

test("exige dependencias obrigatorias", async () => {
  assert.throws(() => new SupabaseCloudSnapshotRepository(), /client e obrigatorio/);

  const repository = new SupabaseCloudSnapshotRepository({ client: createClient() });
  await assert.rejects(
    () => repository.fetchV2(),
    /userId e obrigatorio/
  );
});
