export function buildCatalogFromV2({ accounts, creditCards, categories, categoryTags, budgets, goals }) {
  const categoryById = new Map((categories || []).map((item) => [item.id, item]));

  return {
    source: "v2",
    accounts: (accounts || []).map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      color: item.color || "#0b7285",
      institution: item.institution || "",
      isArchived: Boolean(item.is_archived),
    })),
    creditCards: (creditCards || []).map((item) => ({
      id: item.id,
      name: item.name,
      closingDay: Number(item.closing_day || 25),
      dueDay: Number(item.due_day || 10),
      color: item.color || "#635bff",
      accountId: item.account_id || null,
      brand: item.brand || "",
      isArchived: Boolean(item.is_archived),
    })),
    categories: (categories || []).map((item) => ({
      id: item.id,
      kind: item.kind,
      slug: item.slug,
      name: item.name,
      color: item.color || "#667085",
      monthlyLimit: item.kind === "expense" ? Number(item.monthly_limit || 0) : null,
      isArchived: Boolean(item.is_archived),
    })),
    tags: (categoryTags || []).map((item) => ({
      id: item.id,
      kind: categoryById.get(item.category_id)?.kind || "expense",
      categorySlug: categoryById.get(item.category_id)?.slug || "",
      slug: item.slug,
      name: item.name,
      color: item.color || "#667085",
      isArchived: Boolean(item.is_archived),
    })),
    budgets: (budgets || []).map((item) => ({
      id: item.id,
      categorySlug: categoryById.get(item.category_id)?.slug || "",
      periodKind: item.period_kind,
      amount: Number(item.amount || 0),
    })),
    goals: (goals || []).map((item) => ({
      id: item.id,
      name: item.name,
      target: Number(item.target_amount || 0),
      currentAmount: Number(item.current_amount || 0),
      key: categoryById.get(item.linked_category_id)?.slug || "renda-fixa",
      color: item.color || "#635bff",
      isArchived: Boolean(item.is_archived),
    })),
  };
}
