import assert from "node:assert/strict";
import test from "node:test";
import {
  inferAccountKind,
  isMissingRelationError,
} from "../../../src/infrastructure/sync/SupabaseSyncHelpers.js";

test("detecta erro de relacao ausente do Supabase/PostgREST", () => {
  assert.equal(isMissingRelationError({ message: "relation transactions does not exist" }), true);
  assert.equal(isMissingRelationError({ message: "Could not find table transactions" }), true);
  assert.equal(isMissingRelationError({ code: "PGRST205" }), true);
  assert.equal(isMissingRelationError({ message: "permission denied" }), false);
  assert.equal(isMissingRelationError(null), false);
});

test("infere tipo de conta por nome", () => {
  assert.equal(inferAccountKind("Cartao de credito"), "credit_card");
  assert.equal(inferAccountKind("Corretora XP"), "investment");
  assert.equal(inferAccountKind("Carteira"), "wallet");
  assert.equal(inferAccountKind("Poupanca"), "savings");
  assert.equal(inferAccountKind("Conta corrente"), "checking");
});
