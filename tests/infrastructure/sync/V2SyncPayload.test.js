import assert from "node:assert/strict";
import test from "node:test";
import {
  buildV2CatalogSyncPayload,
  buildV2TransactionSyncPayload,
} from "../../../src/infrastructure/sync/V2SyncPayload.js";

test("monta payload de catalogo v2 preservando catalogo existente", () => {
  const catalog = {
    accounts: [{ name: "Conta corrente" }],
    categories: [{ kind: "expense", slug: "alimentacao", name: "Alimentacao" }],
    tags: [],
    creditCards: [],
    budgets: [],
    goals: [],
  };

  const payload = buildV2CatalogSyncPayload({
    userId: "user-1",
    catalog,
    transactions: [],
  });

  assert.equal(payload.userId, "user-1");
  assert.equal(payload.catalog, catalog);
});

test("hidrata catalogo ausente antes de montar payload v2", () => {
  const settings = { accounts: ["Conta corrente"] };
  const hydratedCatalog = {
    accounts: [{ name: "Conta corrente" }],
    categories: [{ kind: "income", slug: "salario", name: "Salario" }],
    tags: [],
    creditCards: [],
    budgets: [],
    goals: [],
  };
  let receivedSettings = null;

  const payload = buildV2CatalogSyncPayload({
    userId: "user-1",
    settings,
    transactions: [],
    hydrateCatalog: (value) => {
      receivedSettings = value;
      return hydratedCatalog;
    },
  });

  assert.equal(receivedSettings, settings);
  assert.equal(payload.catalog, hydratedCatalog);
});

test("garante que catalogo cobre categorias usadas nos lancamentos", () => {
  const payload = buildV2CatalogSyncPayload({
    userId: "user-1",
    catalog: {
      accounts: [],
      categories: [],
      tags: [],
      creditCards: [],
      budgets: [],
      goals: [],
    },
    transactions: [{
      type: "expense",
      category: "Nova categoria",
      subcategory: "Detalhe",
    }],
  });

  assert.equal(payload.catalog.categories.some((item) => item.slug === "Nova categoria"), true);
  assert.equal(payload.catalog.tags.some((item) => item.slug === "Detalhe"), true);
});

test("monta payload de transacoes v2", () => {
  const refs = { accounts: new Map(), categories: new Map() };
  const transactions = [{ id: "tx-1" }];
  const payload = buildV2TransactionSyncPayload({
    userId: "user-1",
    transactions,
    refs,
  });

  assert.deepEqual(payload, {
    userId: "user-1",
    transactions,
    refs,
  });
});

test("exige dependencias obrigatorias para payload v2", () => {
  assert.throws(
    () => buildV2CatalogSyncPayload({ catalog: {} }),
    /userId e obrigatorio/
  );
  assert.throws(
    () => buildV2CatalogSyncPayload({ userId: "user-1" }),
    /hydrateCatalog e obrigatorio/
  );
  assert.throws(
    () => buildV2TransactionSyncPayload({ refs: {} }),
    /userId e obrigatorio/
  );
  assert.throws(
    () => buildV2TransactionSyncPayload({ userId: "user-1" }),
    /refs e obrigatorio/
  );
});
