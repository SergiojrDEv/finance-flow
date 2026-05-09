export function buildCategoryManagerRows(categories, getTagCount) {
  return categories
    .filter((item) => !item.isArchived)
    .map((item) => ({
      type: item.kind,
      key: item.slug,
      label: item.name,
      color: item.color,
      limit: item.monthlyLimit,
      tagCount: getTagCount(item.kind, item.slug),
    }));
}

export function buildGoalCardRows({ goals, investments, findCategoryName }) {
  return goals.map((goal) => {
    const current = investments
      .filter((item) => item.category === goal.key)
      .reduce((sum, item) => sum + Number(item.amount), 0) || Number(goal.currentAmount || 0);
    const percent = Math.min((current / goal.target) * 100, 100);

    return {
      ...goal,
      current,
      percent,
      categoryName: findCategoryName(goal.key),
    };
  });
}

export function buildGoalsSummary({ goals, investments }) {
  const totals = goals.map((goal) => {
    const current = investments
      .filter((item) => item.category === goal.key)
      .reduce((sum, item) => sum + Number(item.amount), 0) || Number(goal.currentAmount || 0);
    return { goal, current };
  });

  const totalTarget = totals.reduce((sum, item) => sum + Number(item.goal.target || 0), 0);
  const totalCurrent = totals.reduce((sum, item) => sum + Number(item.current || 0), 0);
  const closest = totals
    .map((item) => ({
      name: item.goal.name,
      progress: item.goal.target ? (item.current / item.goal.target) * 100 : 0,
    }))
    .sort((a, b) => b.progress - a.progress)[0] || null;

  return {
    activeCount: goals.length,
    totalTarget,
    totalCurrent,
    closest,
  };
}

export function buildSubcategoryGroups(categories, getTags, getFallbackColor) {
  return categories
    .filter((item) => !item.isArchived)
    .map((item) => ({
      type: item.kind,
      categoryKey: item.slug,
      categoryLabel: item.name,
      fallbackColor: getFallbackColor(item.kind, item.slug),
      tags: getTags(item.kind, item.slug).map((tag) => [tag.slug, tag.name, tag.color]),
    }));
}
