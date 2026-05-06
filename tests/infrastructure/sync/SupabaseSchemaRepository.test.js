import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseSchemaRepository } from "../../../src/infrastructure/sync/SupabaseSchemaRepository.js";

function createClient(result) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push({ method: "from", table });
      return {
        select(columns) {
          calls.push({ method: "select", columns });
          return {
            limit(value) {
              calls.push({ method: "limit", value });
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
}

test("detecta schema v2 disponivel", async () => {
  const client = createClient({ data: [], error: null });
  const repository = new SupabaseSchemaRepository({ client });

  assert.equal(await repository.hasTransactionsV2(), true);
  assert.deepEqual(client.calls, [
    { method: "from", table: "transactions_v2" },
    { method: "select", columns: "id" },
    { method: "limit", value: 1 },
  ]);
});

test("retorna falso quando relacao v2 nao existe", async () => {
  const repository = new SupabaseSchemaRepository({
    client: createClient({ data: null, error: { code: "PGRST205" } }),
  });

  assert.equal(await repository.hasTransactionsV2(), false);
});

test("propaga erro inesperado e exige cliente", async () => {
  assert.throws(() => new SupabaseSchemaRepository(), /client e obrigatorio/);

  const repository = new SupabaseSchemaRepository({
    client: createClient({ data: null, error: new Error("falha") }),
  });

  await assert.rejects(() => repository.hasTransactionsV2(), /falha/);
});
