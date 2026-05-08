import { ensureCatalogCoversTransactions } from "../../core/catalog.js";
import type { CatalogSnapshot, LocalTransaction, V2Refs } from "./syncTypes.js";

export function buildV2CatalogSyncPayload({
  userId,
  catalog,
  settings,
  transactions = [],
  hydrateCatalog,
}: {
  userId?: string;
  catalog?: CatalogSnapshot | null;
  settings?: unknown;
  transactions?: LocalTransaction[];
  hydrateCatalog?: (settings?: unknown, catalog?: CatalogSnapshot | null) => CatalogSnapshot;
} = {}): { userId: string; catalog: CatalogSnapshot } {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!catalog && typeof hydrateCatalog !== "function") {
    throw new Error("hydrateCatalog e obrigatorio quando catalogo nao existe.");
  }

  const sourceCatalog = catalog || hydrateCatalog?.(settings, catalog);
  return {
    userId,
    catalog: ensureCatalogCoversTransactions(sourceCatalog, transactions) as CatalogSnapshot,
  };
}

export function buildV2TransactionSyncPayload({
  userId,
  transactions = [],
  refs,
}: {
  userId?: string;
  transactions?: LocalTransaction[];
  refs?: V2Refs;
} = {}): { userId: string; transactions: LocalTransaction[]; refs: V2Refs } {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!refs) throw new Error("refs e obrigatorio.");

  return {
    userId,
    transactions,
    refs,
  };
}
