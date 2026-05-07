export abstract class CloudSnapshotRepository {
  abstract fetchV2(): Promise<unknown>;
}
