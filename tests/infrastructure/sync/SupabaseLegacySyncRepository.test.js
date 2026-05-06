import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseLegacySyncRepository } from "../../../src/infrastructure/sync/SupabaseLegacySyncRepository.js";

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
    maybeSingle() {
      calls.push({ method: "maybeSingle" });
      return result;
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

function createClient({ remoteTransactions = [], settingsRow = null, errors = {} } = {}) {
  const calls = [];
  const client = {
    from(table) {
      calls.push({ method: "from", table });
      if (table === "transactions") {
        return {
          upsert(rows, options) {
            calls.push({ method: "upsert", table, rows, options });
            return Promise.resolve({ error: errors.upsertTransactions || null });
          },
          select(columns) {
            calls.push({ method: "select", table, columns });
            return createQueryResult({ data: remoteTransactions, error: errors.fetchTransactions || null }, calls);
          },
          delete() {
            calls.push({ method: "delete", table });
            return createQueryResult({ error: errors.deleteTransactions || null }, calls);
          },
        };
      }
      if (table === "finance_settings") {
        return {
          upsert(row) {
            calls.push({ method: "upsert", table, row });
            return Promise.resolve({ error: errors.upsertSettings || null });
          },
          select(columns) {
            calls.push({ method: "select", table, columns });
            return createQueryResult({ data: settingsRow, error: errors.fetchSettings || null }, calls);
          },
        };
      }
      throw new Error(`Tabela inesperada: ${table}`);
    },
    calls,
  };
  return client;
}

test("sincroniza dados legacy e remove remotos ausentes localmente", async () => {
  const client = createClient({
    remoteTransactions: [{ id: "tx-1" }, { id: "tx-old" }],
  });
  const repository = new SupabaseLegacySyncRepository({ client });

  const result = await repository.sync({
    userId: "user-1",
    rows: [{ id: "tx-1" }],
    settings: { theme: "light" },
    localIds: ["tx-1"],
  });

  const txUpsert = client.calls.find((call) => call.method === "upsert" && call.table === "transactions");
  const settingsUpsert = client.calls.find((call) => call.method === "upsert" && call.table === "finance_settings");
  const deleteCall = client.calls.find((call) => call.method === "delete");
  const inCall = client.calls.find((call) => call.method === "in");

  assert.equal(txUpsert.options.onConflict, "id");
  assert.deepEqual(settingsUpsert.row.settings, { theme: "light" });
  assert.equal(deleteCall.table, "transactions");
  assert.deepEqual(inCall.values, ["tx-old"]);
  assert.deepEqual(result.deletedIds, ["tx-old"]);
});

test("sincroniza settings mesmo quando nao ha linhas de transacao", async () => {
  const client = createClient();
  const repository = new SupabaseLegacySyncRepository({ client });

  await repository.sync({ userId: "user-1", rows: [], settings: {}, localIds: [] });

  assert.equal(client.calls.some((call) => call.method === "upsert" && call.table === "transactions"), false);
  assert.equal(client.calls.some((call) => call.method === "upsert" && call.table === "finance_settings"), true);
});

test("busca snapshot legacy de transacoes e settings", async () => {
  const client = createClient({
    remoteTransactions: [{ id: "tx-1" }],
    settingsRow: { settings: { theme: "light" } },
  });
  const repository = new SupabaseLegacySyncRepository({ client });

  const snapshot = await repository.fetch({ userId: "user-1" });

  assert.deepEqual(snapshot, {
    transactions: [{ id: "tx-1" }],
    settings: { theme: "light" },
  });
});

test("exige usuario e propaga erro do Supabase", async () => {
  assert.throws(() => new SupabaseLegacySyncRepository(), /client e obrigatorio/);

  const repository = new SupabaseLegacySyncRepository({
    client: createClient({ errors: { fetchTransactions: new Error("falha") } }),
  });

  await assert.rejects(() => repository.fetch(), /userId e obrigatorio/);
  await assert.rejects(() => repository.fetch({ userId: "user-1" }), /falha/);
});
