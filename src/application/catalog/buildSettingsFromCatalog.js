export function buildSettingsFromCatalog(catalog = {}) {
  const groupedCategories = { expense: [], income: [], investment: [] };
  (catalog.categories || []).forEach((item) => {
    const row = [item.slug, item.name, item.color || "#667085"];
    if (item.kind === "expense") row.push(Number(item.monthlyLimit || 0));
    groupedCategories[item.kind] ||= [];
    groupedCategories[item.kind].push(row);
  });

  const groupedTags = { expense: {}, income: {}, investment: {} };
  (catalog.tags || []).forEach((item) => {
    groupedTags[item.kind] ||= {};
    groupedTags[item.kind][item.categorySlug] ||= [];
    groupedTags[item.kind][item.categorySlug].push([item.slug, item.name, item.color || "#667085"]);
  });

  const budgetRules = {};
  (catalog.budgets || []).forEach((item) => {
    budgetRules[item.categorySlug] ||= { weekly: 0, monthly: 0 };
    budgetRules[item.categorySlug][item.periodKind] = Number(item.amount || 0);
  });

  return {
    accounts: (catalog.accounts || []).map((item) => item.name),
    creditCards: (catalog.creditCards || []).map((item) => ({
      id: item.id,
      name: item.name,
      closingDay: Number(item.closingDay || 25),
      dueDay: Number(item.dueDay || 10),
      color: item.color || "#635bff",
    })),
    categories: groupedCategories,
    subcategories: groupedTags,
    goals: (catalog.goals || []).map((item) => ({
      name: item.name,
      target: Number(item.target || 0),
      key: item.key,
    })),
    budgetRules,
  };
}
