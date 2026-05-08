import { SupabaseCloudSnapshotRepository } from "../sync/SupabaseCloudSnapshotRepository.js";
import { SupabaseCatalogV2SyncRepository } from "../sync/SupabaseCatalogV2SyncRepository.js";
import { SupabaseLegacySyncRepository } from "../sync/SupabaseLegacySyncRepository.js";
import { SupabaseSchemaRepository } from "../sync/SupabaseSchemaRepository.js";
import { SupabaseTransactionV2SyncRepository } from "../sync/SupabaseTransactionV2SyncRepository.js";
import { SupabaseUserProfileRepository } from "../sync/SupabaseUserProfileRepository.js";
import {
  inferAccountKind as defaultInferAccountKind,
  isMissingRelationError as defaultIsMissingRelationError,
} from "../sync/SupabaseSyncHelpers.js";

type CreateSyncServicesDeps = {
  client?: unknown;
  inferAccountKind?: (name?: string) => string;
  isEmailConfirmed?: (user?: unknown) => boolean;
  isMissingRelationError?: (error?: unknown) => boolean;
};

export function createSyncServices({
  client,
  inferAccountKind,
  isEmailConfirmed = () => false,
  isMissingRelationError,
}: CreateSyncServicesDeps = {}) {
  const missingRelationCheck = isMissingRelationError || defaultIsMissingRelationError;

  const cloudSnapshotRepository = new SupabaseCloudSnapshotRepository({
    client,
    isMissingRelationError: missingRelationCheck,
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
  const schemaRepository = new SupabaseSchemaRepository({
    client,
    isMissingRelationError: missingRelationCheck,
  });
  const userProfileRepository = new SupabaseUserProfileRepository({
    client,
    isEmailConfirmed,
  });

  return {
    cloudSnapshotRepository,
    catalogV2SyncRepository,
    legacySyncRepository,
    schemaRepository,
    transactionV2SyncRepository,
    userProfileRepository,
  };
}
