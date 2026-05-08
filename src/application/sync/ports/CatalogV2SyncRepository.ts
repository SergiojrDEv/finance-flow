import type { SyncResult } from "../../shared/applicationTypes.js";

export class CatalogV2SyncRepository {
  async sync(): Promise<SyncResult> {
    throw new Error("CatalogV2SyncRepository.sync precisa ser implementado.");
  }
}
