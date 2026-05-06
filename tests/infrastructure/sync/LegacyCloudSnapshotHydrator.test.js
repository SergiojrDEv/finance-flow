import assert from "node:assert/strict";
import test from "node:test";
import {
  hydrateLegacyCloudSnapshot,
  shouldSkipSilentLegacySnapshot,
} from "../../../src/infrastructure/sync/LegacyCloudSnapshotHydrator.js";

test("decide quando snapshot legacy silencioso deve ser ignorado", () => {
  assert.equal(shouldSkipSilentLegacySnapshot({
    snapshot: { transactions: [] },
    hasLocalTransactions: true,
    silent: true,
  }), true);
  assert.equal(shouldSkipSilentLegacySnapshot({
    snapshot: { transactions: [{ id: "tx-1" }] },
    hasLocalTransactions: true,
    silent: true,
  }), false);
  assert.equal(shouldSkipSilentLegacySnapshot({
    snapshot: { transactions: [] },
    hasLocalTransactions: true,
    silent: false,
  }), false);
});

test("hidrata transacoes legacy sem settings", () => {
  const result = hydrateLegacyCloudSnapshot({
    transactions: [{
      id: "tx-1",
      type: "income",
      descricao: "Salario",
      cat: "salario",
      val: 3100,
      date: "2026-04-24",
      created_at: "2026-04-24T12:00:00.000Z",
    }],
  });

  assert.equal(result.hasSettings, false);
  assert.equal(result.dataMode, "legacy");
  assert.equal(result.settings, null);
  assert.equal(result.transactions[0].description, "Salario");
  assert.equal(result.transactions[0].amount, 3100);
  assert.equal(result.transactions[0].createdAt, "2026-04-24T12:00:00.000Z");
});

test("hidrata settings legacy com catalogo derivado", () => {
  const settings = {
    accounts: ["Conta corrente"],
    categories: { expense: ["moradia"], income: ["salario"], investment: [] },
  };
  const catalog = { categories: [{ slug: "salario", kind: "income" }] };
  let receivedSettings = null;
  let receivedCatalog = null;

  const result = hydrateLegacyCloudSnapshot(
    { transactions: [], settings },
    {
      currentCatalog: { categories: [] },
      mergeSettings: (value) => ({ ...value, merged: true }),
      hydrateCatalog: (mergedSettings, currentCatalog) => {
        receivedSettings = mergedSettings;
        receivedCatalog = currentCatalog;
        return catalog;
      },
    }
  );

  assert.equal(result.hasSettings, true);
  assert.equal(result.settings.merged, true);
  assert.equal(result.catalog, catalog);
  assert.equal(receivedSettings.merged, true);
  assert.deepEqual(receivedCatalog, { categories: [] });
});

test("exige dependencias para hidratar settings legacy", () => {
  assert.throws(
    () => hydrateLegacyCloudSnapshot({ settings: {} }),
    /mergeSettings e obrigatorio/
  );
  assert.throws(
    () => hydrateLegacyCloudSnapshot({ settings: {} }, { mergeSettings: (value) => value }),
    /hydrateCatalog e obrigatorio/
  );
});
