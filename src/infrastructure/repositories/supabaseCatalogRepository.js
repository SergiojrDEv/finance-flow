import { mapAccountRow, mapCreditCardRow } from "../mappers/accountMapper.js";
import { mapCategoryRow, mapCategoryTagRow } from "../mappers/categoryMapper.js";

export function createSupabaseCatalogRepository(client) {
  async function listRuntimeResources(userId) {
    const [accountsResult, creditCardsResult, categoriesResult, categoryTagsResult, budgetsResult, goalsResult] = await Promise.all([
      client.from("accounts").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("credit_cards").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("categories").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("category_tags").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("budgets").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      client.from("goals").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
    ]);

    return {
      accountsResult,
      creditCardsResult,
      categoriesResult,
      categoryTagsResult,
      budgetsResult,
      goalsResult,
    };
  }

  async function listAccountRefs(userId) {
    const result = await client
      .from("accounts")
      .select("id,name,is_archived")
      .eq("user_id", userId);

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function listCategoryRefs(userId) {
    const result = await client
      .from("categories")
      .select("id,kind,slug,color")
      .eq("user_id", userId);

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function listActiveCategoryRefs(userId) {
    const result = await client
      .from("categories")
      .select("id,kind,slug,color")
      .eq("user_id", userId)
      .eq("is_archived", false);

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function listTagRefs(userId) {
    const result = await client
      .from("category_tags")
      .select("id,category_id,slug")
      .eq("user_id", userId);

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function listCardRefs(userId) {
    const result = await client
      .from("credit_cards")
      .select("id")
      .eq("user_id", userId);

    if (result.error) throw result.error;
    return result.data || [];
  }

  async function listCatalog(userId) {
    const [accountsResult, creditCardsResult, categoriesResult, categoryTagsResult] = await Promise.all([
      client.from("accounts").select("*").eq("user_id", userId).order("name"),
      client.from("credit_cards").select("*").eq("user_id", userId).order("name"),
      client.from("categories").select("*").eq("user_id", userId).order("name"),
      client.from("category_tags").select("*").eq("user_id", userId).order("name"),
    ]);

    for (const result of [accountsResult, creditCardsResult, categoriesResult, categoryTagsResult]) {
      if (result.error) throw result.error;
    }

    const categories = (categoriesResult.data || []).map(mapCategoryRow);
    const categoryById = new Map(categories.map((item) => [item.id, item]));

    return {
      accounts: (accountsResult.data || []).map(mapAccountRow),
      creditCards: (creditCardsResult.data || []).map(mapCreditCardRow),
      categories,
      categoryTags: (categoryTagsResult.data || []).map((row) => mapCategoryTagRow(row, categoryById)),
    };
  }

  return {
    listRuntimeResources,
    listAccountRefs,
    listCategoryRefs,
    listActiveCategoryRefs,
    listTagRefs,
    listCardRefs,
    listCatalog,
  };
}
