import { ensureCatalogCoversTransactions } from "../../core/catalog.js";

export function buildV2CatalogSyncPayload({
  userId,
  catalog,
  settings,
  transactions = [],
  hydrateCatalog,
} = {}) {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!catalog && typeof hydrateCatalog !== "function") {
    throw new Error("hydrateCatalog e obrigatorio quando catalogo nao existe.");
  }

  const sourceCatalog = catalog || hydrateCatalog(settings, catalog);
  return {
    userId,
    catalog: ensureCatalogCoversTransactions(sourceCatalog, transactions),
  };
}

export function buildV2TransactionSyncPayload({ userId, transactions = [], refs } = {}) {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!refs) throw new Error("refs e obrigatorio.");

  return {
    userId,
    transactions,
    refs,
  };
}
