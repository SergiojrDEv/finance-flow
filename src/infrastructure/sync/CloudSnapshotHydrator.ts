import { buildCatalogFromV2, ensureCatalogCoversTransactions } from "../../core/catalog.js";
import { mapV2TransactionsWithLegacyFallback } from "../../application/sync/mapCloudSnapshot.js";
import type {
  CloudSnapshotInput,
  CloudSnapshotRefs,
  HydratedCloudSnapshot,
} from "./syncTypes.js";

export function buildCloudSnapshotRefs({
  accounts = [],
  categories = [],
  categoryTags = [],
}: Pick<CloudSnapshotInput, "accounts" | "categories" | "categoryTags"> = {}): CloudSnapshotRefs {
  return {
    accountById: new Map(accounts.map((item) => [String(item.id), item])),
    categoryById: new Map(categories.map((item) => [String(item.id), item])),
    tagById: new Map(categoryTags.map((item) => [String(item.id), item])),
  };
}

export function shouldSkipSilentCloudSnapshot({
  snapshot,
  hasLocalTransactions,
  silent = false,
}: {
  snapshot?: CloudSnapshotInput | null;
  hasLocalTransactions?: boolean;
  silent?: boolean;
} = {}): boolean {
  if (!silent || !hasLocalTransactions) return false;
  return !snapshot?.transactions?.length && !snapshot?.categories?.length;
}

export function hydrateCloudSnapshot(snapshot: CloudSnapshotInput = {}): HydratedCloudSnapshot {
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
    ) as HydratedCloudSnapshot["catalog"],
    dataMode: "v2",
    transactions: mapV2TransactionsWithLegacyFallback({
      rows: transactions,
      legacyRows: legacyTransactions,
      refs,
    }) as HydratedCloudSnapshot["transactions"],
  };
}
