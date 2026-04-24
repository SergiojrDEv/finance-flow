export function createV2CatalogWriteAdapter() {
  function buildBasePayloads({ userId, catalog, nowIso, inferAccountKind }) {
    return {
      accountRows: catalog.accounts.map((account) => ({
        user_id: userId,
        name: account.name,
        kind: account.kind || inferAccountKind(account.name),
        color: account.color || "#0b7285",
        is_archived: false,
        updated_at: nowIso,
      })),
      categoryRows: catalog.categories.map((item) => ({
        user_id: userId,
        kind: item.kind,
        slug: item.slug,
        name: item.name,
        color: item.color || "#667085",
        monthly_limit: item.kind === "expense" ? Number(item.monthlyLimit || 0) : null,
        is_archived: false,
        updated_at: nowIso,
      })),
      creditCardRows: catalog.creditCards.map((card) => ({
        id: card.id,
        user_id: userId,
        name: card.name,
        color: card.color || "#635bff",
        closing_day: Number(card.closingDay || 25),
        due_day: Number(card.dueDay || 10),
        is_archived: false,
        updated_at: nowIso,
      })),
    };
  }

  function buildDependentPayloads({ userId, catalog, categoryKeyToId, nowIso }) {
    return {
      tagRows: catalog.tags.flatMap((item) => {
        const category = categoryKeyToId.get(`${item.kind}:${item.categorySlug}`);
        if (!category) return [];
        return [{
          user_id: userId,
          category_id: category.id,
          slug: item.slug,
          name: item.name,
          color: item.color || category.color || "#667085",
          is_archived: false,
          updated_at: nowIso,
        }];
      }),
      budgetRows: catalog.budgets.flatMap((item) => {
        const category = categoryKeyToId.get(`expense:${item.categorySlug}`);
        if (!category) return [];
        return [{
          user_id: userId,
          category_id: category.id,
          period_kind: item.periodKind,
          amount: Number(item.amount || 0),
          starts_on: nowIso.slice(0, 10),
          updated_at: nowIso,
        }];
      }),
      goalRows: catalog.goals.map((goal) => ({
        user_id: userId,
        name: goal.name,
        target_amount: Number(goal.target || 0),
        current_amount: Number(goal.currentAmount || 0),
        linked_category_id: categoryKeyToId.get(`investment:${goal.key}`)?.id || null,
        color: goal.color || "#635bff",
        updated_at: nowIso,
      })),
    };
  }

  return {
    buildBasePayloads,
    buildDependentPayloads,
  };
}
