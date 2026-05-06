import { mapLegacyRowToLocalTransaction } from "./LegacyTransactionMapper.js";

export function shouldSkipSilentLegacySnapshot({ snapshot, hasLocalTransactions, silent = false } = {}) {
  if (!silent || !hasLocalTransactions) return false;
  return !snapshot?.transactions?.length;
}

export function hydrateLegacyCloudSnapshot(
  snapshot = {},
  { mergeSettings, hydrateCatalog, currentCatalog } = {}
) {
  const transactions = (snapshot.transactions || []).map((row) => mapLegacyRowToLocalTransaction(row));
  const result = {
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
