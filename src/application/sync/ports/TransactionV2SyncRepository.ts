import type { SyncResult } from "../../shared/applicationTypes.js";

export class TransactionV2SyncRepository {
  async sync(): Promise<SyncResult> {
    throw new Error("TransactionV2SyncRepository.sync precisa ser implementado.");
  }
}
