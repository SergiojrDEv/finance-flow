import { mapAccountRow, mapCreditCardRow } from "../mappers/accountMapper.js";
import { mapCategoryRow, mapCategoryTagRow } from "../mappers/categoryMapper.js";

export function createSupabaseCatalogRepository(client) {
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
    listCatalog,
  };
}
