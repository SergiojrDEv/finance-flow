import { TransactionV2SyncRepository } from "../../application/sync/ports/TransactionV2SyncRepository.js";
import { planTransactionV2Sync } from "../../application/sync/planTransactionSync.js";

export class SupabaseTransactionV2SyncRepository extends TransactionV2SyncRepository {
  constructor({ client } = {}) {
    super();

    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
  }

  async sync({ userId, transactions = [], refs = {}, now = new Date().toISOString() } = {}) {
    if (!userId) throw new Error("userId e obrigatorio.");

    const { data: currentTags, error: currentTagsError } = await this.client
      .from("category_tags")
      .select("id,category_id,slug")
      .eq("user_id", userId)
      .eq("is_archived", false);
    if (currentTagsError) throw currentTagsError;

    const tagIds = new Map((currentTags || []).map((item) => [`${item.category_id}:${item.slug}`, item.id]));

    const { data: remoteRows, error: remoteRowsError } = await this.client
      .from("transactions_v2")
      .select("id")
      .eq("user_id", userId);
    if (remoteRowsError) throw remoteRowsError;

    const plan = planTransactionV2Sync({
      localTransactions: transactions,
      remoteTransactions: remoteRows || [],
      refs: {
        userId,
        categories: refs.categories,
        accounts: refs.accounts,
        tagIds,
        now,
      },
    });

    if (plan.upserts.length) {
      const { error } = await this.client.from("transactions_v2").upsert(plan.upserts, { onConflict: "id" });
      if (error) throw error;
    }

    if (plan.deletes.length) {
      const { error } = await this.client.from("transactions_v2").delete().eq("user_id", userId).in("id", plan.deletes);
      if (error) throw error;
    }

    return plan;
  }
}
