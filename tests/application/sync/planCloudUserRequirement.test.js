import assert from "node:assert/strict";
import test from "node:test";
import { planCloudUserRequirement } from "../../../src/application/sync/planCloudUserRequirement.js";

test("recusa quando cliente Supabase nao existe", () => {
  assert.deepEqual(planCloudUserRequirement({ hasClient: false, hasUser: true }), {
    ok: false,
    errors: { client: "cloud_unavailable" },
  });
});

test("recusa quando usuario nao esta conectado", () => {
  assert.deepEqual(planCloudUserRequirement({ hasClient: true, hasUser: false }), {
    ok: false,
    errors: { user: "user_required" },
  });
});

test("permite quando cliente e usuario existem", () => {
  assert.deepEqual(planCloudUserRequirement({ hasClient: true, hasUser: true }), {
    ok: true,
    value: {},
  });
});
