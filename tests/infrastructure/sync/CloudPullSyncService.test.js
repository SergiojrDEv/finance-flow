import assert from "node:assert/strict";
import test from "node:test";
import { pullCloudSync } from "../../../src/infrastructure/sync/CloudPullSyncService.js";

function createServices({ v2Snapshot, legacySnapshot } = {}) {
  const calls = [];
  return {
    calls,
    cloudSnapshotRepository: {
      async fetchV2(payload) {
        calls.push({ method: "fetchV2", payload });
        return v2Snapshot;
      },
    },
    legacySyncRepository: {
      async fetch(payload) {
        calls.push({ method: "fetchLegacy", payload });
        return legacySnapshot;
      },
    },
  };
}

test("baixa e hidrata snapshot V2", async () => {
  const services = createServices({
    v2Snapshot: {
      accounts: [{ id: "account-1", name: "Conta corrente", kind: "checking" }],
      creditCards: [],
      categories: [{ id: "cat-income", kind: "income", slug: "salario", name: "Salario" }],
      categoryTags: [],
      budgets: [],
      goals: [],
      transactions: [{
        id: "tx-1",
        transaction_kind: "income",
        description: "Salario",
        amount: 3100,
        transaction_date: "2026-04-24",
        account_id: "account-1",
        category_id: "cat-income",
        status: "paid",
        created_at: "2026-04-24T12:00:00.000Z",
      }],
      legacyTransactions: [],
    },
  });

  const result = await pullCloudSync({
    services,
    userId: "user-1",
    supportsV2: true,
  });

  assert.equal(result.skipped, false);
  assert.equal(result.source, "v2");
  assert.equal(result.shouldSyncSettingsFromCatalog, true);
  assert.equal(result.hydrated.dataMode, "v2");
  assert.equal(result.hydrated.transactions[0].description, "Salario");
  assert.deepEqual(services.calls, [{ method: "fetchV2", payload: { userId: "user-1" } }]);
});

test("ignora snapshot V2 vazio em modo silencioso quando ha dados locais", async () => {
  const result = await pullCloudSync({
    services: createServices({ v2Snapshot: { transactions: [], categories: [] } }),
    userId: "user-1",
    supportsV2: true,
    silent: true,
    hasLocalTransactions: true,
  });

  assert.deepEqual(result, {
    skipped: true,
    source: "v2",
    hydrated: null,
    shouldSyncSettingsFromCatalog: false,
  });
});

test("baixa e hidrata snapshot legacy", async () => {
  const settings = { accounts: ["Conta corrente"] };
  const catalog = { categories: [{ slug: "salario", kind: "income" }] };
  const services = createServices({
    legacySnapshot: {
      settings,
      transactions: [{
        id: "tx-1",
        type: "income",
        descricao: "Salario",
        cat: "salario",
        val: 3100,
        date: "2026-04-24",
        created_at: "2026-04-24T12:00:00.000Z",
      }],
    },
  });

  const result = await pullCloudSync({
    services,
    userId: "user-1",
    supportsV2: false,
    currentCatalog: { categories: [] },
    mergeSettings: (value) => ({ ...value, merged: true }),
    hydrateCatalog: () => catalog,
  });

  assert.equal(result.skipped, false);
  assert.equal(result.source, "legacy");
  assert.equal(result.shouldSyncSettingsFromCatalog, false);
  assert.equal(result.hydrated.dataMode, "legacy");
  assert.equal(result.hydrated.settings.merged, true);
  assert.equal(result.hydrated.catalog, catalog);
  assert.equal(result.hydrated.transactions[0].amount, 3100);
  assert.deepEqual(services.calls, [{ method: "fetchLegacy", payload: { userId: "user-1" } }]);
});

test("ignora snapshot legacy vazio em modo silencioso quando ha dados locais", async () => {
  const result = await pullCloudSync({
    services: createServices({ legacySnapshot: { transactions: [] } }),
    userId: "user-1",
    supportsV2: false,
    silent: true,
    hasLocalTransactions: true,
  });

  assert.deepEqual(result, {
    skipped: true,
    source: "legacy",
    hydrated: null,
    shouldSyncSettingsFromCatalog: false,
  });
});

test("exige dependencias obrigatorias", async () => {
  await assert.rejects(
    () => pullCloudSync({ userId: "user-1" }),
    /services e obrigatorio/
  );
  await assert.rejects(
    () => pullCloudSync({ services: createServices() }),
    /userId e obrigatorio/
  );
});
