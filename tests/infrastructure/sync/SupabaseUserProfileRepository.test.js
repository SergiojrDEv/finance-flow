import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseUserProfileRepository } from "../../../src/infrastructure/sync/SupabaseUserProfileRepository.js";

function createClient({ error = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push({ method: "from", table });
      return {
        async upsert(row) {
          calls.push({ method: "upsert", table, row });
          return { error };
        },
      };
    },
  };
}

test("salva perfil do usuario confirmado a partir dos metadados", async () => {
  const client = createClient();
  const repository = new SupabaseUserProfileRepository({
    client,
    isEmailConfirmed: () => true,
  });

  const result = await repository.saveFromMetadata({
    id: "user-1",
    user_metadata: {
      full_name: "Sergio Junior",
      cpf: "12345678909",
      phone: "(11) 99999-9999",
      birthdate: "1990-01-01",
    },
  });

  const upsertCall = client.calls.find((call) => call.method === "upsert");

  assert.equal(result.skipped, false);
  assert.equal(upsertCall.table, "user_profiles");
  assert.equal(upsertCall.row.user_id, "user-1");
  assert.equal(upsertCall.row.full_name, "Sergio Junior");
  assert.equal(upsertCall.row.birthdate, "1990-01-01");
});

test("ignora usuario sem confirmacao id ou metadados relevantes", async () => {
  const client = createClient();
  const repository = new SupabaseUserProfileRepository({
    client,
    isEmailConfirmed: (user) => Boolean(user.email_confirmed_at),
  });

  assert.deepEqual(await repository.saveFromMetadata({ id: "user-1" }), { skipped: true });
  assert.deepEqual(await repository.saveFromMetadata({ email_confirmed_at: "2026-04-24" }), { skipped: true });
  assert.deepEqual(await repository.saveFromMetadata({ id: "user-1", email_confirmed_at: "2026-04-24", user_metadata: {} }), { skipped: true });
  assert.equal(client.calls.length, 0);
});

test("propaga erro do Supabase e exige dependencias", async () => {
  assert.throws(() => new SupabaseUserProfileRepository(), /client e obrigatorio/);
  assert.throws(() => new SupabaseUserProfileRepository({ client: createClient() }), /isEmailConfirmed e obrigatorio/);

  const repository = new SupabaseUserProfileRepository({
    client: createClient({ error: new Error("falha") }),
    isEmailConfirmed: () => true,
  });

  await assert.rejects(
    () => repository.saveFromMetadata({ id: "user-1", user_metadata: { full_name: "Sergio" } }),
    /falha/
  );
});
