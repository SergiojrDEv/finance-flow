function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function percent(used, limit) {
  return limit ? Math.min((used / limit) * 100, 100) : 0;
}

function resolveReferenceDate(currentDate, today) {
  return monthKey(currentDate) === monthKey(today)
    ? today
    : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
}

function resolveWeekRange(referenceDate) {
  const weekday = (referenceDate.getDay() + 6) % 7;
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - weekday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: toDateInput(weekStart),
    end: toDateInput(weekEnd),
  };
}

export function buildBudgetOverview({
  transactions = [],
  categories = [],
  budgetRules = {},
  currentDate = new Date(),
  today = new Date(),
} = {}) {
  const expenses = (Array.isArray(transactions) ? transactions : []).filter((item) => item?.type === "expense");
  const referenceDate = resolveReferenceDate(currentDate, today);
  const weekRange = resolveWeekRange(referenceDate);

  return categories.map(([key, label, color]) => {
    const rule = budgetRules[key] || { weekly: 0, monthly: 0 };
    const weeklyLimit = toAmount(rule.weekly);
    const monthlyLimit = toAmount(rule.monthly);
    const monthlyUsed = expenses
      .filter((item) => item.category === key)
      .reduce((sum, item) => sum + toAmount(item.amount), 0);
    const weeklyUsed = expenses
      .filter((item) => item.category === key && item.date >= weekRange.start && item.date <= weekRange.end)
      .reduce((sum, item) => sum + toAmount(item.amount), 0);
    const weeklyPct = percent(weeklyUsed, weeklyLimit);
    const monthlyPct = percent(monthlyUsed, monthlyLimit);

    return {
      key,
      label,
      color,
      rule: {
        weekly: weeklyLimit,
        monthly: monthlyLimit,
      },
      used: {
        weekly: Math.round((weeklyUsed + Number.EPSILON) * 100) / 100,
        monthly: Math.round((monthlyUsed + Number.EPSILON) * 100) / 100,
      },
      pct: {
        weekly: weeklyPct,
        monthly: monthlyPct,
      },
      status: {
        weekly: weeklyPct >= 100 ? "Limite semanal" : `${weeklyPct.toFixed(0)}%`,
        monthly: monthlyPct >= 100 ? "Limite mensal" : `${monthlyPct.toFixed(0)}%`,
      },
    };
  });
}
