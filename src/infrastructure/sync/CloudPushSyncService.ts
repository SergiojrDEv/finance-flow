import { buildLegacySyncPayload } from "./LegacySyncPayload.js";
import {
  buildV2CatalogSyncPayload,
  buildV2TransactionSyncPayload,
} from "./V2SyncPayload.js";
import type { PushCloudSyncInput, PushCloudSyncResult } from "./syncTypes.js";

export async function pushCloudSync({
  services,
  userId,
  supportsV2 = false,
  catalog,
  settings = {},
  transactions = [],
  hydrateCatalog,
  parseLocalDate,
}: PushCloudSyncInput = {}): Promise<PushCloudSyncResult> {
  if (!services) throw new Error("services e obrigatorio.");
  if (!userId) throw new Error("userId e obrigatorio.");

  let syncedCatalog = catalog || null;
  let v2Refs = null;

  if (supportsV2) {
    const catalogPayload = buildV2CatalogSyncPayload({
      userId,
      catalog,
      settings,
      transactions,
      hydrateCatalog,
    });
    syncedCatalog = catalogPayload.catalog;
    v2Refs = await services.catalogV2SyncRepository.sync(catalogPayload);
    await services.transactionV2SyncRepository.sync(buildV2TransactionSyncPayload({
      userId,
      transactions,
      refs: v2Refs,
    }));
  }

  await services.legacySyncRepository.sync(buildLegacySyncPayload({
    userId,
    transactions,
    settings,
    parseLocalDate,
  }));

  return {
    catalog: syncedCatalog,
    supportsV2: Boolean(supportsV2),
    v2Refs,
  };
}
