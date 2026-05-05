import assert from "node:assert/strict";
import test from "node:test";

import { SupabaseTransactionV2SyncRepository } from "../../../src/infrastructure/sync/SupabaseTransactionV2SyncRepository.js";

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

function createClient({ tags = [], remoteTransactions = [] } = {}) {
  const calls = [];
  const client = {
    from(table) {
      calls.push({ method: "from", table });
      if (table === "category_tags") return createQueryResult({ data: tags, error: null }, calls);
      if (table !== "transactions_v2") throw new Error(`Tabela inesperada: ${table}`);
      return {
        select(columns) {
          calls.push({ method: "select", columns });
          return createQueryResult({ data: remoteTransactions, error: null }, calls);
        },
        upsert(rows, options) {
          calls.push({ method: "upsert", rows, options });
          return Promise.resolve({ error: null });
        },
        delete() {
          calls.push({ method: "delete" });
          return createQueryResult({ error: null }, calls);
        },
      };
    },
    calls,
  };
  return client;
}

test("sincroniza lancamentos v2 por planner sem expor Supabase ao modulo principal", async () => {
  const client = createClient({
    tags: [{ id: "tag-market", category_id: "cat-food", slug: "Mercado" }],
    remoteTransactions: [{ id: "tx-1" }, { id: "tx-old" }],
  });
  const repository = new SupabaseTransactionV2SyncRepository({ client });

  const plan = await repository.sync({
    userId: "user-1",
    now: "2026-04-24T12:00:00.000Z",
    transactions: [
      {
        id: "tx-1",
        type: "expense",
        description: "Mercado",
        amount: 80,
        date: "2026-04-24",
        category: "Alimentacao",
        subcategory: "Mercado",
        account: "Conta corrente",
      },
      {
        id: "tx-2",
        type: "income",
        description: "Salario",
        amount: 3100,
        date: "2026-04-24",
        category: "Salario",
        account: "Conta corrente",
      },
    ],
    refs: {
      categories: new Map([["expense:Alimentacao", { id: "cat-food" }]]),
      accounts: new Map([["conta corrente", "account-main"]]),
    },
  });

  const upsertCall = client.calls.find((call) => call.method === "upsert");
  const deleteCall = client.calls.find((call) => call.method === "delete");
  const inCall = client.calls.find((call) => call.method === "in");

  assert.deepEqual(plan.deletes, ["tx-old"]);
  assert.equal(upsertCall.options.onConflict, "id");
  assert.deepEqual(upsertCall.rows.map((row) => row.id), ["tx-1", "tx-2"]);
  assert.equal(upsertCall.rows[0].category_tag_id, "tag-market");
  assert.equal(deleteCall.method, "delete");
  assert.deepEqual(inCall.values, ["tx-old"]);
});

test("nao chama upsert ou delete quando nao ha nada para sincronizar", async () => {
  const client = createClient();
  const repository = new SupabaseTransactionV2SyncRepository({ client });

  const plan = await repository.sync({
    userId: "user-1",
    transactions: [],
    refs: { categories: new Map(), accounts: new Map() },
  });

  assert.deepEqual(plan, { upserts: [], deletes: [] });
  assert.equal(client.calls.some((call) => call.method === "upsert"), false);
  assert.equal(client.calls.some((call) => call.method === "delete"), false);
});

test("exige dependencias obrigatorias", async () => {
  assert.throws(() => new SupabaseTransactionV2SyncRepository(), /client e obrigatorio/);

  const repository = new SupabaseTransactionV2SyncRepository({ client: createClient() });
  await assert.rejects(
    () => repository.sync({ transactions: [] }),
    /userId e obrigatorio/
  );
});
