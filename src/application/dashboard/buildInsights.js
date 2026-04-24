export function buildInsights({ transactions, expenseBudgets, income, investment, now = new Date(), formatAmount = (value) => String(value) }) {
  const insights = [];
  const pending = transactions
    .filter((item) => item.status !== "paid" && item.dueDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 3);

  pending.forEach((item) => {
    const due = new Date(`${item.dueDate}T00:00:00`);
    const diff = Math.ceil((due - now) / 86400000);
    insights.push({
      label: diff < 0 ? "Vencido" : diff === 0 ? "Vence hoje" : `Vence em ${diff} dia${diff === 1 ? "" : "s"}`,
      text: `${item.description}: ${formatAmount(Number(item.amount || 0))}`,
    });
  });

  expenseBudgets.forEach((budget) => {
    const threshold = Number(budget.limit || 0);
    if (!threshold) return;
    const used = transactions
      .filter((item) => item.type === "expense" && item.category === budget.slug)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (used >= threshold * 0.8) {
      insights.push({
        label: used > threshold ? "Orcamento estourado" : "Perto do limite",
        text: `${budget.name}: ${formatAmount(used)} de ${formatAmount(threshold)}`,
      });
    }
  });

  if (income && investment / income >= 0.1) {
    insights.push({
      label: "Boa disciplina",
      text: `Voce investiu ${((investment / income) * 100).toFixed(1)}% da renda.`,
    });
  }

  return insights.slice(0, 5);
}
