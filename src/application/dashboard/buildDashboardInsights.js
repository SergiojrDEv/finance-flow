function toAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function daysBetween(dateValue, today) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const reference = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((due - reference) / 86400000);
}

export function buildDashboardInsights({
  transactions = [],
  expenseCategories = [],
  budgetRules = {},
  totals = {},
  today = new Date(),
} = {}) {
  const insights = [];
  const pending = transactions
    .filter((item) => item?.status !== "paid" && item?.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  pending.forEach((item) => {
    const diff = daysBetween(item.dueDate, today);
    insights.push({
      kind: "due",
      label: diff < 0 ? "Vencido" : diff === 0 ? "Vence hoje" : `Vence em ${diff} dia${diff === 1 ? "" : "s"}`,
      description: item.description,
      amount: toAmount(item.amount),
    });
  });

  expenseCategories.forEach(([key, label, , limit]) => {
    const threshold = Number(budgetRules?.[key]?.monthly || limit || 0);
    if (!threshold) return;
    const used = transactions
      .filter((item) => item?.type === "expense" && item.category === key)
      .reduce((sum, item) => sum + toAmount(item.amount), 0);
    if (used >= threshold * 0.8) {
      insights.push({
        kind: "budget",
        label: used > threshold ? "Orcamento estourado" : "Perto do limite",
        description: label,
        amount: used,
        threshold,
      });
    }
  });

  if (totals.income && totals.investment / totals.income >= 0.1) {
    insights.push({
      kind: "investment",
      label: "Boa disciplina",
      investmentRate: (totals.investment / totals.income) * 100,
    });
  }

  return insights;
}
