export class TransactionV2SyncRepository {
  async sync(): Promise<unknown> {
    throw new Error("TransactionV2SyncRepository.sync precisa ser implementado.");
  }
}
