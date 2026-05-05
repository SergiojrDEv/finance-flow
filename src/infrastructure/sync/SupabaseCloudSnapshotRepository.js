import { CloudSnapshotRepository } from "../../application/sync/ports/CloudSnapshotRepository.js";

export class SupabaseCloudSnapshotRepository extends CloudSnapshotRepository {
  constructor({ client, isMissingRelationError } = {}) {
    super();

    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
    this.isMissingRelationError = isMissingRelationError || (() => false);
  }

  async fetchV2({ userId } = {}) {
    if (!userId) throw new Error("userId e obrigatorio.");

    const [
      accountsResult,
      cardsResult,
      categoriesResult,
      tagsResult,
      budgetsResult,
      goalsResult,
      transactionsResult,
      legacyTransactionsResult,
    ] = await Promise.all([
      this.client.from("accounts").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      this.client.from("credit_cards").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      this.client.from("categories").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      this.client.from("category_tags").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      this.client.from("budgets").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      this.client.from("goals").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      this.client.from("transactions_v2").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      this.client.from("transactions").select("id,cat,subcat,type").eq("user_id", userId),
    ]);

    const firstError = [
      accountsResult.error,
      cardsResult.error,
      categoriesResult.error,
      tagsResult.error,
      budgetsResult.error,
      goalsResult.error,
      transactionsResult.error,
      legacyTransactionsResult.error && !this.isMissingRelationError(legacyTransactionsResult.error) ? legacyTransactionsResult.error : null,
    ].find(Boolean);
    if (firstError) throw firstError;

    return {
      accounts: accountsResult.data || [],
      creditCards: cardsResult.data || [],
      categories: categoriesResult.data || [],
      categoryTags: tagsResult.data || [],
      budgets: budgetsResult.data || [],
      goals: goalsResult.data || [],
      transactions: transactionsResult.data || [],
      legacyTransactions: legacyTransactionsResult.data || [],
    };
  }
}
