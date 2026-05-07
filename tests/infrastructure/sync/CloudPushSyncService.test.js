import assert from "node:assert/strict";
import test from "node:test";
import { pushCloudSync } from "../../../src/infrastructure/sync/CloudPushSyncService.js";

const parseLocalDate = (value) => {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
};

function createServices() {
  const calls = [];
  const refs = {
    accounts: new Map([["conta corrente", "account-main"]]),
    categories: new Map(),
  };
  return {
    calls,
    refs,
    catalogV2SyncRepository: {
      async sync(payload) {
        calls.push({ method: "catalogV2", payload });
        return refs;
      },
    },
    transactionV2SyncRepository: {
      async sync(payload) {
        calls.push({ method: "transactionsV2", payload });
        return { upserts: [], deletes: [] };
      },
    },
    legacySyncRepository: {
      async sync(payload) {
        calls.push({ method: "legacy", payload });
      },
    },
  };
}

test("sincroniza V2 e legacy quando schema V2 existe", async () => {
  const services = createServices();
  const catalog = {
    accounts: [{ name: "Conta corrente" }],
    categories: [{ kind: "income", slug: "salario", name: "Salario" }],
    tags: [],
    creditCards: [],
    budgets: [],
    goals: [],
  };
  const settings = { accounts: ["Conta corrente"] };
  const transactions = [{
    id: "tx-1",
    type: "income",
    description: "Salario",
    category: "salario",
    amount: 3100,
    date: "2026-04-24",
  }];

  const result = await pushCloudSync({
    services,
    userId: "user-1",
    supportsV2: true,
    catalog,
    settings,
    transactions,
    parseLocalDate,
  });

  assert.deepEqual(services.calls.map((call) => call.method), ["catalogV2", "transactionsV2", "legacy"]);
  assert.equal(result.catalog, catalog);
  assert.equal(result.supportsV2, true);
  assert.equal(result.v2Refs, services.refs);
  assert.equal(services.calls[0].payload.userId, "user-1");
  assert.equal(services.calls[1].payload.refs, services.refs);
  assert.equal(services.calls[2].payload.rows[0].descricao, "Salario");
});

test("sincroniza apenas legacy quando V2 nao existe", async () => {
  const services = createServices();

  const result = await pushCloudSync({
    services,
    userId: "user-1",
    supportsV2: false,
    catalog: null,
    settings: { accounts: [] },
    transactions: [],
    parseLocalDate,
  });

  assert.deepEqual(services.calls.map((call) => call.method), ["legacy"]);
  assert.equal(result.catalog, null);
  assert.equal(result.supportsV2, false);
  assert.equal(result.v2Refs, null);
});

test("hidrata catalogo quando V2 precisa e catalogo esta ausente", async () => {
  const services = createServices();
  const hydratedCatalog = {
    accounts: [],
    categories: [],
    tags: [],
    creditCards: [],
    budgets: [],
    goals: [],
  };

  const result = await pushCloudSync({
    services,
    userId: "user-1",
    supportsV2: true,
    settings: { accounts: [] },
    transactions: [],
    hydrateCatalog: () => hydratedCatalog,
    parseLocalDate,
  });

  assert.equal(result.catalog, hydratedCatalog);
  assert.equal(services.calls[0].payload.catalog, hydratedCatalog);
});

test("exige dependencias obrigatorias", async () => {
  await assert.rejects(
    () => pushCloudSync({ userId: "user-1", parseLocalDate }),
    /services e obrigatorio/
  );
  await assert.rejects(
    () => pushCloudSync({ services: createServices(), parseLocalDate }),
    /userId e obrigatorio/
  );
});
