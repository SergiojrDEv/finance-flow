import assert from "node:assert/strict";
import test from "node:test";
import worker, { getSupabaseConfig } from "../../src/worker.js";

test("retorna config Supabase publica a partir do ambiente", () => {
  assert.deepEqual(getSupabaseConfig({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
  }), {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
  });
});

test("recusa config ausente", () => {
  assert.equal(getSupabaseConfig({}), null);
});

test("serve /api/config sem cache quando ambiente existe", async () => {
  const response = await worker.fetch(new Request("https://finance-flow.test/api/config"), {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    ASSETS: { fetch: () => new Response("asset") },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
  });
});

test("serve erro 500 em /api/config quando ambiente esta incompleto", async () => {
  const response = await worker.fetch(new Request("https://finance-flow.test/api/config"), {
    ASSETS: { fetch: () => new Response("asset") },
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Supabase config is missing." });
});

test("delega demais rotas para assets estaticos", async () => {
  const response = await worker.fetch(new Request("https://finance-flow.test/#visao-geral"), {
    ASSETS: { fetch: () => new Response("asset") },
  });

  assert.equal(await response.text(), "asset");
});
