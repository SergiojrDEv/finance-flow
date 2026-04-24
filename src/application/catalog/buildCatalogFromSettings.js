function localId(prefix, ...parts) {
  return `${prefix}:${parts.map((part) => String(part || "").toLowerCase()).join(":")}`;
}

function inferAccountKind(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("cartao")) return "credit_card";
  if (lower.includes("corretora")) return "investment";
  if (lower.includes("carteira")) return "wallet";
  if (lower.includes("poupanca")) return "savings";
  return "checking";
}

export function buildCatalogFromSettings(settings = {}, existingCatalog = {}) {
  const previousAccounts = new Map((existingCatalog.accounts || []).map((item) => [String(item.name || "").toLowerCase(), item]));
  const previousCards = new Map((existingCatalog.creditCards || []).map((item) => [item.id || String(item.name || "").toLowerCase(), item]));
  const previousCategories = new Map((existingCatalog.categories || []).map((item) => [`${item.kind}:${item.slug}`, item]));
  const previousTags = new Map((existingCatalog.tags || []).map((item) => [`${item.kind}:${item.categorySlug}:${item.slug}`, item]));
  const previousBudgets = new Map((existingCatalog.budgets || []).map((item) => [`${item.categorySlug}:${item.periodKind}`, item]));
  const previousGoals = new Map((existingCatalog.goals || []).map((item) => [`${item.key}:${String(item.name || "").toLowerCase()}`, item]));

  const accounts = (settings.accounts || []).map((name) => {
    const previous = previousAccounts.get(String(name || "").toLowerCase());
    return {
      id: previous?.id || localId("account", name),
      name,
      kind: previous?.kind || inferAccountKind(name),
      color: previous?.color || "#0b7285",
      institution: previous?.institution || "",
      isArchived: false,
    };
  });

  const creditCards = (settings.creditCards || []).map((card) => {
    const previous = previousCards.get(card.id) || previousCards.get(String(card.name || "").toLowerCase());
    return {
      id: previous?.id || card.id || localId("card", card.name),
      name: card.name,
      closingDay: Number(card.closingDay || 25),
      dueDay: Number(card.dueDay || 10),
      color: previous?.color || card.color || "#635bff",
      accountId: previous?.accountId || null,
      brand: previous?.brand || "",
      isArchived: false,
    };
  });

  const categories = Object.entries(settings.categories || {}).flatMap(([kind, items]) =>
    (items || []).map(([slug, name, color, monthlyLimit]) => {
      const previous = previousCategories.get(`${kind}:${slug}`);
      return {
        id: previous?.id || localId("category", kind, slug),
        kind,
        slug,
        name,
        color: color || previous?.color || "#667085",
        monthlyLimit: kind === "expense" ? Number(monthlyLimit || 0) : null,
        isArchived: false,
      };
    })
  );

  const tags = Object.entries(settings.subcategories || {}).flatMap(([kind, categoryGroups]) =>
    Object.entries(categoryGroups || {}).flatMap(([categorySlug, items]) =>
      (items || []).map(([slug, name, color]) => {
        const previous = previousTags.get(`${kind}:${categorySlug}:${slug}`);
        return {
          id: previous?.id || localId("tag", kind, categorySlug, slug),
          kind,
          categorySlug,
          slug,
          name,
          color: color || previous?.color || "#667085",
          isArchived: false,
        };
      })
    )
  );

  const budgets = Object.entries(settings.budgetRules || {}).flatMap(([categorySlug, values]) => ([
    {
      id: previousBudgets.get(`${categorySlug}:weekly`)?.id || localId("budget", categorySlug, "weekly"),
      categorySlug,
      periodKind: "weekly",
      amount: Number(values?.weekly || 0),
    },
    {
      id: previousBudgets.get(`${categorySlug}:monthly`)?.id || localId("budget", categorySlug, "monthly"),
      categorySlug,
      periodKind: "monthly",
      amount: Number(values?.monthly || 0),
    },
  ]));

  const goals = (settings.goals || []).map((goal, index) => {
    const previous = previousGoals.get(`${goal.key}:${String(goal.name || "").toLowerCase()}`);
    return {
      id: previous?.id || localId("goal", goal.key, index, goal.name),
      name: goal.name,
      target: Number(goal.target || 0),
      currentAmount: Number(previous?.currentAmount || 0),
      key: goal.key,
      color: previous?.color || "#635bff",
      isArchived: false,
    };
  });

  return {
    source: existingCatalog.source || "legacy",
    accounts,
    creditCards,
    categories,
    tags,
    budgets,
    goals,
  };
}
