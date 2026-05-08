export class CatalogV2SyncRepository {
  async sync(): Promise<unknown> {
    throw new Error("CatalogV2SyncRepository.sync precisa ser implementado.");
  }
}
