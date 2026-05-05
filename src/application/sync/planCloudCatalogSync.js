function keyByBudget(item) {
  return `${item.categoryId}:${item.periodKind}`;
}

function keyByGoal(item) {
  return `${String(item.name || "").trim().toLowerCase()}:${item.linkedCategoryId || ""}`;
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
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
