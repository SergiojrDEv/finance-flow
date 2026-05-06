import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SUPABASE_CONFIG_ENDPOINTS,
  fetchSupabaseConfig,
  loadSupabaseConfig,
} from "../../../src/infrastructure/config/SupabaseConfigProvider.js";

const validConfig = {
  url: "https://example.supabase.co",
  anonKey: "anon-key",
};

test("usa configuracao explicita quando ela existe", async () => {
  const config = await loadSupabaseConfig({
    explicitConfig: validConfig,
    fetchConfig: async () => {
      throw new Error("nao deve buscar endpoint");
    },
  });

  assert.deepEqual(config, validConfig);
});

test("tenta endpoints em ordem e retorna primeira config valida", async () => {
  const calls = [];
  const config = await loadSupabaseConfig({
    endpoints: ["/api/config", "/fallback/config"],
    fetchConfig: async (endpoint) => {
      calls.push(endpoint);
      return endpoint === "/fallback/config" ? validConfig : null;
    },
  });

  assert.deepEqual(calls, ["/api/config", "/fallback/config"]);
  assert.deepEqual(config, validConfig);
});

test("registra erro de endpoint e continua tentando os proximos", async () => {
  const logs = [];
  const config = await loadSupabaseConfig({
    endpoints: ["/api/config", "/fallback/config"],
    fetchConfig: async (endpoint) => {
      if (endpoint === "/api/config") throw new Error("indisponivel");
      return validConfig;
    },
    logger: {
      error: (...args) => logs.push(args),
    },
  });

  assert.deepEqual(config, validConfig);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1], "/api/config");
});

test("usa fallback temporario quando endpoints nao retornam config valida", async () => {
  const config = await loadSupabaseConfig({
    endpoints: DEFAULT_SUPABASE_CONFIG_ENDPOINTS,
    fetchConfig: async () => null,
    fallbackConfig: validConfig,
  });

  assert.deepEqual(config, validConfig);
});

test("retorna null quando nao ha endpoint valido nem fallback", async () => {
  const config = await loadSupabaseConfig({
    fetchConfig: async () => null,
  });

  assert.equal(config, null);
});

test("fetchSupabaseConfig consulta endpoint sem cache", async () => {
  const calls = [];
  const config = await fetchSupabaseConfig("/api/config", {
    fetchImpl: async (...args) => {
      calls.push(args);
      return {
        ok: true,
        async json() {
          return validConfig;
        },
      };
    },
  });

  assert.deepEqual(config, validConfig);
  assert.deepEqual(calls, [["/api/config", { cache: "no-store" }]]);
});

test("fetchSupabaseConfig ignora resposta invalida ou nao ok", async () => {
  const invalid = await fetchSupabaseConfig("/api/config", {
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return { url: "" };
      },
    }),
  });
  const notOk = await fetchSupabaseConfig("/api/config", {
    fetchImpl: async () => ({ ok: false }),
  });

  assert.equal(invalid, null);
  assert.equal(notOk, null);
});
