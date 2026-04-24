export function buildSettingsOverview(catalog = {}) {
  const activeAccounts = (catalog.accounts || []).filter((item) => !item.isArchived);
  const activeCards = (catalog.creditCards || []).filter((item) => !item.isArchived);
  const activeCategories = (catalog.categories || []).filter((item) => !item.isArchived);
  const activeTags = (catalog.tags || []).filter((item) => !item.isArchived);
  const activeGoals = (catalog.goals || []).filter((item) => !item.isArchived);

  return {
    accountCount: activeAccounts.length,
    cardCount: activeCards.length,
    categoryCount: activeCategories.length,
    tagCount: activeTags.length,
    goalCount: activeGoals.length,
    categoriesByKind: {
      expense: activeCategories.filter((item) => item.kind === "expense").length,
      income: activeCategories.filter((item) => item.kind === "income").length,
      investment: activeCategories.filter((item) => item.kind === "investment").length,
    },
  };
}
