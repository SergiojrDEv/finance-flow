import { mapLegacyRowToLocalTransaction } from "./LegacyTransactionMapper.js";
import type {
  CatalogSnapshot,
  HydratedLegacyCloudSnapshot,
  LegacyCloudSnapshotInput,
} from "./syncTypes.js";

export function shouldSkipSilentLegacySnapshot({
  snapshot,
  hasLocalTransactions,
  silent = false,
}: {
  snapshot?: LegacyCloudSnapshotInput | null;
  hasLocalTransactions?: boolean;
  silent?: boolean;
} = {}): boolean {
  if (!silent || !hasLocalTransactions) return false;
  return !snapshot?.transactions?.length;
}

export function hydrateLegacyCloudSnapshot(
  snapshot: LegacyCloudSnapshotInput = {},
  {
    mergeSettings,
    hydrateCatalog,
    currentCatalog,
  }: {
    mergeSettings?: (settings?: Record<string, unknown> | null) => Record<string, unknown>;
    hydrateCatalog?: (settings?: Record<string, unknown> | null, currentCatalog?: CatalogSnapshot | null) => CatalogSnapshot;
    currentCatalog?: CatalogSnapshot | null;
  } = {},
): HydratedLegacyCloudSnapshot {
  const transactions = (snapshot.transactions || []).map((row) => mapLegacyRowToLocalTransaction(row));
  const result: HydratedLegacyCloudSnapshot = {
    transactions,
    hasSettings: Boolean(snapshot.settings),
    settings: null,
    catalog: currentCatalog || null,
    dataMode: "legacy",
  };

  if (!snapshot.settings) return result;
  if (typeof mergeSettings !== "function") {
    throw new Error("mergeSettings e obrigatorio para hidratar settings legacy.");
  }
  if (typeof hydrateCatalog !== "function") {
    throw new Error("hydrateCatalog e obrigatorio para hidratar settings legacy.");
  }

  result.settings = mergeSettings(snapshot.settings);
  result.catalog = hydrateCatalog(result.settings, currentCatalog);
  return result;
}
