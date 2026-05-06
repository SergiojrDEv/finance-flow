import { isMissingRelationError as defaultIsMissingRelationError } from "./SupabaseSyncHelpers.js";

export class SupabaseSchemaRepository {
  constructor({ client, isMissingRelationError = defaultIsMissingRelationError } = {}) {
    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
    this.isMissingRelationError = isMissingRelationError;
  }

  async hasTransactionsV2() {
    const { error } = await this.client
      .from("transactions_v2")
      .select("id")
      .limit(1);

    if (!error) return true;
    if (this.isMissingRelationError(error)) return false;
    throw error;
  }
}
