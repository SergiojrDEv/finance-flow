import { isMissingRelationError as defaultIsMissingRelationError } from "./SupabaseSyncHelpers.js";
import type { MissingRelationError, SupabaseClientLike } from "./syncTypes.js";

export class SupabaseSchemaRepository {
  private readonly client: SupabaseClientLike;
  private readonly isMissingRelationError: (error?: MissingRelationError | Error | null) => boolean;

  constructor({
    client,
    isMissingRelationError = defaultIsMissingRelationError,
  }: {
    client?: SupabaseClientLike;
    isMissingRelationError?: (error?: MissingRelationError | Error | null) => boolean;
  } = {}) {
    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
    this.isMissingRelationError = isMissingRelationError;
  }

  async hasTransactionsV2(): Promise<boolean> {
    const query = this.client
      .from("transactions_v2")
      .select?.("id");
    const { error } = await query?.limit?.(1) || { error: new Error("Supabase select limit indisponivel.") };

    if (!error) return true;
    if (this.isMissingRelationError(error)) return false;
    throw error;
  }
}
