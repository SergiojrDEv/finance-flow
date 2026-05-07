export abstract class CatalogV2SyncRepository {
  abstract sync(): Promise<unknown>;
}
