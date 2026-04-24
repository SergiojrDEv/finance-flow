import { buildCatalogFromV2 } from "../../application/catalog/buildCatalogFromV2.js";
import { ensureCatalogCoversTransactions } from "../../core/catalog.js";

export function createV2CatalogReadAdapter() {
  function fromSupabasePayload(payload) {
    return ensureCatalogCoversTransactions(
      buildCatalogFromV2({
        accounts: payload.accounts,
        creditCards: payload.creditCards,
        categories: payload.categories,
        categoryTags: payload.categoryTags,
        budgets: payload.budgets,
        goals: payload.goals,
      }),
      payload.legacyTransactions || []
    );
  }

  return {
    fromSupabasePayload,
  };
}
