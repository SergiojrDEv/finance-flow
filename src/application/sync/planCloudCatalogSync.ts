function keyByBudget(item) {
  return `${item.categoryId}:${item.periodKind}`;
}

function keyByGoal(item) {
  return `${String(item.name || "").trim().toLowerCase()}:${item.linkedCategoryId || ""}`;
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

export function buildAccountRows({ accounts = [], userId, now = new Date().toISOString(), inferAccountKind } = {}) {
  return accounts.map((account) => ({
    user_id: userId,
    name: account.name,
    kind: account.kind || inferAccountKind?.(account.name) || "checking",
    color: account.color || "#0b7285",
    is_archived: false,
    updated_at: now,
  }));
}

export function findStaleAccountIds({ localAccounts = [], remoteAccounts = [] } = {}) {
  const activeNames = new Set(localAccounts.map((item) => String(item.name || "").toLowerCase()));
  return remoteAccounts
    .filter((item) => item.id && !activeNames.has(String(item.name || "").toLowerCase()))
    .map((item) => item.id);
}

export function buildCategoryRows({ categories = [], userId, now = new Date().toISOString() } = {}) {
  return categories.map((item) => ({
    user_id: userId,
    kind: item.kind,
    slug: item.slug,
    name: item.name,
    color: item.color || "#667085",
    monthly_limit: item.kind === "expense" ? Number(item.monthlyLimit || 0) : null,
    is_archived: false,
    updated_at: now,
  }));
}

export function findStaleCategoryIds({ localCategoryRows = [], remoteCategories = [] } = {}) {
  const activeKeys = new Set(localCategoryRows.map((item) => `${item.kind}:${item.slug}`));
  return remoteCategories
    .filter((item) => item.id && !activeKeys.has(`${item.kind}:${item.slug}`))
    .map((item) => item.id);
}

export function buildTagRows({ tags = [], categoryKeyToId = new Map(), userId, now = new Date().toISOString() } = {}) {
  return tags.flatMap((item) => {
    const category = categoryKeyToId.get(`${item.kind}:${item.categorySlug}`);
    if (!category) return [];
    return [{
      user_id: userId,
      category_id: category.id,
      slug: item.slug,
      name: item.name,
      color: item.color || category.color || "#667085",
      is_archived: false,
      updated_at: now,
    }];
  });
}

export function findStaleTagIds({ localTagRows = [], remoteTags = [] } = {}) {
  const activeKeys = new Set(localTagRows.map((item) => `${item.category_id}:${item.slug}`));
  return remoteTags
    .filter((item) => item.id && !activeKeys.has(`${item.category_id}:${item.slug}`))
    .map((item) => item.id);
}

export function buildCreditCardRows({ creditCards = [], userId, now = new Date().toISOString() } = {}) {
  return creditCards.map((card) => ({
    id: card.id,
    user_id: userId,
    name: card.name,
    color: card.color || "#635bff",
    closing_day: Number(card.closingDay || 25),
    due_day: Number(card.dueDay || 10),
    is_archived: false,
    updated_at: now,
  }));
}

export function findStaleCreditCardIds({ localCreditCards = [], remoteCreditCards = [] } = {}) {
  const activeIds = new Set(localCreditCards.map((item) => item.id));
  return remoteCreditCards
    .map((item) => item.id)
    .filter((id) => id && !activeIds.has(id));
}

export function buildBudgetRows({ budgets = [], categoryKeyToId = new Map(), userId, now = new Date().toISOString() } = {}) {
  return budgets.flatMap((item) => {
    const category = categoryKeyToId.get(`expense:${item.categorySlug}`);
    if (!category) return [];
    return [{
      user_id: userId,
      category_id: category.id,
      categoryId: category.id,
      period_kind: item.periodKind,
      periodKind: item.periodKind,
      amount: Number(item.amount || 0),
      starts_on: now.slice(0, 10),
      updated_at: now,
    }];
  });
}

export function buildGoalRows({ goals = [], categoryKeyToId = new Map(), userId, now = new Date().toISOString() } = {}) {
  return goals.map((goal) => {
    const linkedCategoryId = categoryKeyToId.get(`investment:${goal.key}`)?.id || null;
    return {
      id: isUuid(goal.id) ? goal.id : undefined,
      user_id: userId,
      name: goal.name,
      target_amount: Number(goal.target || 0),
      current_amount: Number(goal.currentAmount || 0),
      linked_category_id: linkedCategoryId,
      linkedCategoryId,
      color: goal.color || "#635bff",
      is_archived: Boolean(goal.isArchived),
      updated_at: now,
    };
  });
}

export function planBudgetSync({ localBudgets = [], remoteBudgets = [] } = {}) {
  const remoteByKey = new Map(remoteBudgets.map((item) => [keyByBudget(item), item]));
  const activeRemoteIds = new Set();

  const upserts = localBudgets.map((item) => {
    const remote = remoteByKey.get(keyByBudget(item));
    if (remote?.id) activeRemoteIds.add(remote.id);
    return {
      action: remote?.id ? "update" : "insert",
      remoteId: remote?.id || null,
      value: item,
    };
  });

  const deletes = remoteBudgets
    .filter((item) => item.id && !activeRemoteIds.has(item.id))
    .map((item) => item.id);

  return { upserts, deletes };
}

export function planGoalSync({ localGoals = [], remoteGoals = [] } = {}) {
  const remoteById = new Map(remoteGoals.map((item) => [item.id, item]));
  const remoteByNaturalKey = new Map(remoteGoals.map((item) => [keyByGoal(item), item]));
  const activeRemoteIds = new Set();

  const upserts = localGoals.map((item) => {
    const remote = isUuid(item.id) ? remoteById.get(item.id) : remoteByNaturalKey.get(keyByGoal(item));
    if (remote?.id) activeRemoteIds.add(remote.id);
    return {
      action: remote?.id ? "update" : "insert",
      remoteId: remote?.id || null,
      value: item,
    };
  });

  const archives = remoteGoals
    .filter((item) => item.id && !activeRemoteIds.has(item.id))
    .map((item) => item.id);

  return { upserts, archives };
}
