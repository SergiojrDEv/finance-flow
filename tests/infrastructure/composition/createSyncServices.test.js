import assert from "node:assert/strict";
import test from "node:test";

import { CloudSnapshotRepository } from "../../../src/application/sync/ports/CloudSnapshotRepository.js";
import { CatalogV2SyncRepository } from "../../../src/application/sync/ports/CatalogV2SyncRepository.js";
import { TransactionV2SyncRepository } from "../../../src/application/sync/ports/TransactionV2SyncRepository.js";
import { createSyncServices } from "../../../src/infrastructure/composition/createSyncServices.js";

test("monta repositorios de sync v2", () => {
  const client = { from() {} };
  const services = createSyncServices({
    client,
    inferAccountKind: () => "checking",
  });

  assert.equal(services.cloudSnapshotRepository instanceof CloudSnapshotRepository, true);
  assert.equal(services.catalogV2SyncRepository instanceof CatalogV2SyncRepository, true);
  assert.equal(services.transactionV2SyncRepository instanceof TransactionV2SyncRepository, true);
});

test("propaga erro quando cliente Supabase nao existe", () => {
  assert.throws(
    () => createSyncServices(),
    /client e obrigatorio/
  );
});
