import { SupabaseCloudSnapshotRepository } from "../sync/SupabaseCloudSnapshotRepository.js";
import { SupabaseCatalogV2SyncRepository } from "../sync/SupabaseCatalogV2SyncRepository.js";
import { SupabaseLegacySyncRepository } from "../sync/SupabaseLegacySyncRepository.js";
import { SupabaseTransactionV2SyncRepository } from "../sync/SupabaseTransactionV2SyncRepository.js";
import {
  inferAccountKind as defaultInferAccountKind,
  isMissingRelationError as defaultIsMissingRelationError,
} from "../sync/SupabaseSyncHelpers.js";

export function createSyncServices({ client, inferAccountKind, isMissingRelationError } = {}) {
  const cloudSnapshotRepository = new SupabaseCloudSnapshotRepository({
    client,
    isMissingRelationError: isMissingRelationError || defaultIsMissingRelationError,
  });
  const catalogV2SyncRepository = new SupabaseCatalogV2SyncRepository({
    client,
    inferAccountKind: inferAccountKind || defaultInferAccountKind,
  });
  const transactionV2SyncRepository = new SupabaseTransactionV2SyncRepository({
    client,
  });
  const legacySyncRepository = new SupabaseLegacySyncRepository({
    client,
  });

  return {
    cloudSnapshotRepository,
    catalogV2SyncRepository,
    legacySyncRepository,
    transactionV2SyncRepository,
  };
}
