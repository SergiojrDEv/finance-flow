import { SupabaseCatalogV2SyncRepository } from "../sync/SupabaseCatalogV2SyncRepository.js";
import { SupabaseTransactionV2SyncRepository } from "../sync/SupabaseTransactionV2SyncRepository.js";

export function createSyncServices({ client, inferAccountKind } = {}) {
  const catalogV2SyncRepository = new SupabaseCatalogV2SyncRepository({
    client,
    inferAccountKind,
  });
  const transactionV2SyncRepository = new SupabaseTransactionV2SyncRepository({
    client,
  });

  return {
    catalogV2SyncRepository,
    transactionV2SyncRepository,
  };
}
