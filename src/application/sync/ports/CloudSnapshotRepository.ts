import type { CloudSnapshot } from "../../shared/applicationTypes.js";

export class CloudSnapshotRepository {
  async fetchV2(): Promise<CloudSnapshot> {
    throw new Error("CloudSnapshotRepository.fetchV2 precisa ser implementado.");
  }
}
