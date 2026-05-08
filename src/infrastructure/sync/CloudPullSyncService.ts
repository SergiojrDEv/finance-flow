import {
  hydrateCloudSnapshot,
  shouldSkipSilentCloudSnapshot,
} from "./CloudSnapshotHydrator.js";
import {
  hydrateLegacyCloudSnapshot,
  shouldSkipSilentLegacySnapshot,
} from "./LegacyCloudSnapshotHydrator.js";
import type { PullCloudSyncInput, PullCloudSyncResult } from "./syncTypes.js";

export async function pullCloudSync({
  services,
  userId,
  supportsV2 = false,
  silent = false,
  hasLocalTransactions = false,
  currentCatalog,
  mergeSettings,
  hydrateCatalog,
}: PullCloudSyncInput = {}): Promise<PullCloudSyncResult> {
  if (!services) throw new Error("services e obrigatorio.");
  if (!userId) throw new Error("userId e obrigatorio.");

  if (supportsV2) {
    const snapshot = await services.cloudSnapshotRepository.fetchV2({ userId });
    if (shouldSkipSilentCloudSnapshot({ snapshot, hasLocalTransactions, silent })) {
      return { skipped: true, source: "v2", hydrated: null, shouldSyncSettingsFromCatalog: false };
    }

    return {
      skipped: false,
      source: "v2",
      hydrated: hydrateCloudSnapshot(snapshot),
      shouldSyncSettingsFromCatalog: true,
    };
  }

  const snapshot = await services.legacySyncRepository.fetch({ userId });
  if (shouldSkipSilentLegacySnapshot({ snapshot, hasLocalTransactions, silent })) {
    return { skipped: true, source: "legacy", hydrated: null, shouldSyncSettingsFromCatalog: false };
  }

  return {
    skipped: false,
    source: "legacy",
    hydrated: hydrateLegacyCloudSnapshot(snapshot, {
      currentCatalog,
      mergeSettings,
      hydrateCatalog,
    }),
    shouldSyncSettingsFromCatalog: false,
  };
}
