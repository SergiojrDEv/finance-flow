export abstract class TransactionV2SyncRepository {
  abstract sync(): Promise<unknown>;
}
