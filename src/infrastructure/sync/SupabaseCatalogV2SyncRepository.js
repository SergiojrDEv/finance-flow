import { CatalogV2SyncRepository } from "../../application/sync/ports/CatalogV2SyncRepository.js";
import {
  buildAccountRows,
  buildBudgetRows,
  buildCategoryRows,
  buildCreditCardRows,
  buildGoalRows,
  buildTagRows,
  findStaleAccountIds,
  findStaleCategoryIds,
  findStaleCreditCardIds,
  findStaleTagIds,
  planBudgetSync,
  planGoalSync,
} from "../../application/sync/planCloudCatalogSync.js";

export class SupabaseCatalogV2SyncRepository extends CatalogV2SyncRepository {
  constructor({ client, inferAccountKind } = {}) {
    super();

    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
    this.inferAccountKind = inferAccountKind;
  }

  async sync({ userId, catalog, now = new Date().toISOString() } = {}) {
    if (!userId) throw new Error("userId e obrigatorio.");
    if (!catalog) throw new Error("catalog e obrigatorio.");

    const existingAccounts = await this.syncAccounts({ userId, catalog, now });
    const categoryKeyToId = await this.syncCategories({ userId, catalog, now });
    const tagRows = await this.syncTags({ userId, catalog, categoryKeyToId, now });
    await this.syncCreditCards({ userId, catalog, now });
    await this.syncBudgets({ userId, catalog, categoryKeyToId, now });
    await this.syncGoals({ userId, catalog, categoryKeyToId, now });

    return {
      accounts: new Map((existingAccounts || []).map((item) => [item.name.toLowerCase(), item.id])),
      categories: categoryKeyToId,
      tags: new Map(tagRows.map((item) => [`${item.category_id}:${item.slug}`, item])),
    };
  }

  async syncAccounts({ userId, catalog, now }) {
    const accountRows = buildAccountRows({
      accounts: catalog.accounts,
      userId,
      now,
      inferAccountKind: this.inferAccountKind,
    });
    if (accountRows.length) {
      const { error } = await this.client.from("accounts").upsert(accountRows, { onConflict: "user_id,name" });
      if (error) throw error;
    }

    const { data: existingAccounts, error: accountsFetchError } = await this.client
      .from("accounts")
      .select("id,name,is_archived")
      .eq("user_id", userId);
    if (accountsFetchError) throw accountsFetchError;

    const staleAccountIds = findStaleAccountIds({
      localAccounts: catalog.accounts,
      remoteAccounts: existingAccounts || [],
    });
    if (staleAccountIds.length) {
      const { error } = await this.client.from("accounts").update({ is_archived: true, updated_at: now }).in("id", staleAccountIds);
      if (error) throw error;
    }

    return existingAccounts || [];
  }

  async syncCategories({ userId, catalog, now }) {
    const categoryRows = buildCategoryRows({
      categories: catalog.categories,
      userId,
      now,
    });
    if (categoryRows.length) {
      const { error } = await this.client.from("categories").upsert(categoryRows, { onConflict: "user_id,kind,slug" });
      if (error) throw error;
    }

    const { data: existingCategories, error: categoriesFetchError } = await this.client
      .from("categories")
      .select("id,kind,slug")
      .eq("user_id", userId);
    if (categoriesFetchError) throw categoriesFetchError;

    const staleCategoryIds = findStaleCategoryIds({
      localCategoryRows: categoryRows,
      remoteCategories: existingCategories || [],
    });
    if (staleCategoryIds.length) {
      const { error } = await this.client.from("categories").update({ is_archived: true, updated_at: now }).in("id", staleCategoryIds);
      if (error) throw error;
    }

    const { data: freshCategories, error: freshCategoriesError } = await this.client
      .from("categories")
      .select("id,kind,slug,color")
      .eq("user_id", userId)
      .eq("is_archived", false);
    if (freshCategoriesError) throw freshCategoriesError;

    return new Map((freshCategories || []).map((item) => [`${item.kind}:${item.slug}`, item]));
  }

  async syncTags({ userId, catalog, categoryKeyToId, now }) {
    const tagRows = buildTagRows({
      tags: catalog.tags,
      categoryKeyToId,
      userId,
      now,
    });
    if (tagRows.length) {
      const { error } = await this.client.from("category_tags").upsert(tagRows, { onConflict: "user_id,category_id,slug" });
      if (error) throw error;
    }

    const { data: existingTags, error: tagsFetchError } = await this.client
      .from("category_tags")
      .select("id,category_id,slug")
      .eq("user_id", userId);
    if (tagsFetchError) throw tagsFetchError;

    const staleTagIds = findStaleTagIds({
      localTagRows: tagRows,
      remoteTags: existingTags || [],
    });
    if (staleTagIds.length) {
      const { error } = await this.client.from("category_tags").update({ is_archived: true, updated_at: now }).in("id", staleTagIds);
      if (error) throw error;
    }

    return tagRows;
  }

  async syncCreditCards({ userId, catalog, now }) {
    const creditCardRows = buildCreditCardRows({
      creditCards: catalog.creditCards,
      userId,
      now,
    });
    if (creditCardRows.length) {
      const { error } = await this.client.from("credit_cards").upsert(creditCardRows, { onConflict: "id" });
      if (error) throw error;
    }

    const { data: existingCards, error: cardsFetchError } = await this.client
      .from("credit_cards")
      .select("id")
      .eq("user_id", userId);
    if (cardsFetchError) throw cardsFetchError;

    const staleCardIds = findStaleCreditCardIds({
      localCreditCards: catalog.creditCards,
      remoteCreditCards: existingCards || [],
    });
    if (staleCardIds.length) {
      const { error } = await this.client.from("credit_cards").update({ is_archived: true, updated_at: now }).in("id", staleCardIds);
      if (error) throw error;
    }
  }

  async syncBudgets({ userId, catalog, categoryKeyToId, now }) {
    const budgetRows = buildBudgetRows({
      budgets: catalog.budgets,
      categoryKeyToId,
      userId,
      now,
    });

    const { data: existingBudgets, error: existingBudgetsError } = await this.client
      .from("budgets")
      .select("id,category_id,period_kind")
      .eq("user_id", userId);
    if (existingBudgetsError) throw existingBudgetsError;

    const budgetPlan = planBudgetSync({
      localBudgets: budgetRows,
      remoteBudgets: (existingBudgets || []).map((item) => ({
        id: item.id,
        categoryId: item.category_id,
        periodKind: item.period_kind,
      })),
    });
    for (const operation of budgetPlan.upserts) {
      const row = operation.value;
      if (operation.action === "update") {
        const { error } = await this.client
          .from("budgets")
          .update({
            amount: row.amount,
            starts_on: row.starts_on,
            ends_on: null,
            updated_at: row.updated_at,
          })
          .eq("id", operation.remoteId)
          .eq("user_id", userId);
        if (error) throw error;
        continue;
      }

      const { categoryId: _categoryId, periodKind: _periodKind, ...payload } = row;
      const { error } = await this.client
        .from("budgets")
        .insert(payload);
      if (error) throw error;
    }

    if (budgetPlan.deletes.length) {
      const { error } = await this.client.from("budgets").delete().eq("user_id", userId).in("id", budgetPlan.deletes);
      if (error) throw error;
    }
  }

  async syncGoals({ userId, catalog, categoryKeyToId, now }) {
    const goalRows = buildGoalRows({
      goals: catalog.goals,
      categoryKeyToId,
      userId,
      now,
    });

    const { data: existingGoals, error: existingGoalsError } = await this.client
      .from("goals")
      .select("id,name,linked_category_id")
      .eq("user_id", userId);
    if (existingGoalsError) throw existingGoalsError;

    const goalPlan = planGoalSync({
      localGoals: goalRows,
      remoteGoals: (existingGoals || []).map((item) => ({
        id: item.id,
        name: item.name,
        linkedCategoryId: item.linked_category_id || null,
      })),
    });
    for (const operation of goalPlan.upserts) {
      const row = operation.value;
      if (operation.action === "update") {
        const { id: _ignoredId, linkedCategoryId: _linkedCategoryId, ...payload } = row;
        const { error } = await this.client
          .from("goals")
          .update(payload)
          .eq("id", operation.remoteId)
          .eq("user_id", userId);
        if (error) throw error;
        continue;
      }

      const payload = { ...row };
      if (!payload.id) delete payload.id;
      delete payload.linkedCategoryId;
      const { error } = await this.client
        .from("goals")
        .insert(payload);
      if (error) throw error;
    }

    if (goalPlan.archives.length) {
      const { error } = await this.client
        .from("goals")
        .update({ is_archived: true, updated_at: now })
        .eq("user_id", userId)
        .in("id", goalPlan.archives);
      if (error) throw error;
    }
  }
}
