import { buildCatalogFromV2, ensureCatalogCoversTransactions } from "../../core/catalog.js";
import { mapV2TransactionsWithLegacyFallback } from "../../application/sync/mapCloudSnapshot.js";

export function buildCloudSnapshotRefs({ accounts = [], categories = [], categoryTags = [] } = {}) {
  return {
    accountById: new Map(accounts.map((item) => [item.id, item])),
    categoryById: new Map(categories.map((item) => [item.id, item])),
    tagById: new Map(categoryTags.map((item) => [item.id, item])),
  };
}

export function shouldSkipSilentCloudSnapshot({ snapshot, hasLocalTransactions, silent = false } = {}) {
  if (!silent || !hasLocalTransactions) return false;
  return !snapshot?.transactions?.length && !snapshot?.categories?.length;
}

export function hydrateCloudSnapshot(snapshot = {}) {
  const {
    accounts = [],
    creditCards = [],
    categories = [],
    categoryTags = [],
    budgets = [],
    goals = [],
    transactions = [],
    legacyTransactions = [],
  } = snapshot;

  const refs = buildCloudSnapshotRefs({ accounts, categories, categoryTags });

  return {
    catalog: ensureCatalogCoversTransactions(
      buildCatalogFromV2({ accounts, creditCards, categories, categoryTags, budgets, goals }),
      legacyTransactions
    ),
    dataMode: "v2",
    transactions: mapV2TransactionsWithLegacyFallback({
      rows: transactions,
      legacyRows: legacyTransactions,
      refs,
    }),
  };
}
