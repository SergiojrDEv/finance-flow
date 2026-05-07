import assert from "node:assert/strict";
import test from "node:test";
import { applyCloudPullResult } from "../../../src/application/sync/applyCloudPullResult.js";

test("mantem estado quando resultado foi ignorado", () => {
  const state = { transactions: [{ id: "local" }] };
  const result = applyCloudPullResult(state, { skipped: true });

  assert.equal(result.skipped, true);
  assert.equal(result.state, state);
  assert.deepEqual(state.transactions, [{ id: "local" }]);
});

test("aplica resultado V2 e sincroniza settings a partir do catalogo", () => {
  const state = { transactions: [], settings: null, catalog: null, dataMode: null };
  const catalog = { categories: [{ slug: "salario" }] };
  const settings = { accounts: ["Conta corrente"] };
  let synced = false;

  const result = applyCloudPullResult(
    state,
    {
      skipped: false,
      shouldSyncSettingsFromCatalog: true,
      hydrated: {
        transactions: [{ id: "tx-1" }],
        catalog,
        dataMode: "v2",
      },
    },
    {
      syncSettingsFromCatalog: () => {
        synced = true;
        return settings;
      },
    }
  );

  assert.equal(result.skipped, false);
  assert.equal(result.shouldSyncSettingsFromCatalog, true);
  assert.equal(synced, true);
  assert.deepEqual(state.transactions, [{ id: "tx-1" }]);
  assert.equal(state.catalog, catalog);
  assert.equal(state.settings, settings);
  assert.equal(state.dataMode, "v2");
});

test("aplica resultado legacy quando ha settings", () => {
  const state = { transactions: [], settings: null, catalog: null, dataMode: null };
  const settings = { accounts: ["Carteira"] };
  const catalog = { accounts: [{ name: "Carteira" }] };

  const result = applyCloudPullResult(state, {
    skipped: false,
    shouldSyncSettingsFromCatalog: false,
    hydrated: {
      transactions: [{ id: "tx-legacy" }],
      hasSettings: true,
      settings,
      catalog,
      dataMode: "legacy",
    },
  });

  assert.equal(result.skipped, false);
  assert.equal(result.shouldSyncSettingsFromCatalog, false);
  assert.deepEqual(state.transactions, [{ id: "tx-legacy" }]);
  assert.equal(state.settings, settings);
  assert.equal(state.catalog, catalog);
  assert.equal(state.dataMode, "legacy");
});

test("aplica transacoes legacy sem trocar settings quando snapshot nao tem settings", () => {
  const settings = { accounts: ["Atual"] };
  const catalog = { accounts: [{ name: "Atual" }] };
  const state = { transactions: [], settings, catalog, dataMode: "legacy" };

  applyCloudPullResult(state, {
    skipped: false,
    shouldSyncSettingsFromCatalog: false,
    hydrated: {
      transactions: [{ id: "tx-legacy" }],
      hasSettings: false,
      settings: null,
      catalog: null,
      dataMode: "legacy",
    },
  });

  assert.deepEqual(state.transactions, [{ id: "tx-legacy" }]);
  assert.equal(state.settings, settings);
  assert.equal(state.catalog, catalog);
  assert.equal(state.dataMode, "legacy");
});

test("exige argumentos obrigatorios", () => {
  assert.throws(() => applyCloudPullResult(null, {}), /currentState e obrigatorio/);
  assert.throws(() => applyCloudPullResult({}, null), /pullResult e obrigatorio/);
});
