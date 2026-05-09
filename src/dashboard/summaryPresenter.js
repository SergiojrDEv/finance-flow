const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function money(value) {
  return formatter.format(value || 0);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildSummaryView({ transactions, summary }) {
  const free = summary.totals.available;

  return {
    totals: {
      income: money(summary.totals.income),
      expenses: money(summary.totals.expenses),
      investments: money(summary.totals.investments),
      available: money(free),
    },
    counts: {
      income: `${summary.counts.income} lancamentos`,
      expenseCategories: `${summary.counts.expenseCategories} categorias`,
    },
    rates: {
      investment: `${summary.rates.investmentRate.toFixed(1)}% da receita direcionado para investimento`,
      commitment: `${summary.rates.commitmentRate.toFixed(1)}% da receita ja foi comprometida`,
    },
    health: {
      score: `${summary.health.score}%`,
      copy: summary.health.status === "negative"
        ? `Mes no vermelho: depois de despesas e investimentos, faltam ${money(Math.abs(free))} para o disponivel imediato fechar positivo.`
        : summary.health.copy,
    },
    homeBalanceCopy: free >= 0
      ? "Saldo disponivel para movimentacao imediata"
      : `Faltam ${money(Math.abs(free))} para voltar ao positivo`,
    totalsForInsights: {
      income: summary.totals.income,
      expense: summary.totals.expenses,
      investment: summary.totals.investments,
    },
    free,
    hasTransactions: Boolean(transactions.length),
  };
}

export function buildSmartDashboardView({
  transactions,
  totals,
  free,
  currentDate,
  today = new Date(),
  previousSummary,
}) {
  const currentMonth = monthKey(currentDate) === monthKey(today);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dayRef = currentMonth ? today.getDate() : 1;
  const remainingDays = Math.max(1, daysInMonth - dayRef + 1);
  const dailySafe = Math.max(0, free / remainingDays);
  const previousTotals = {
    income: previousSummary.totals.income,
    expense: previousSummary.totals.expenses,
  };
  const previousFree = previousSummary.totals.available;
  const freeDelta = free - previousFree;
  const commitment = totals.income ? ((totals.expense + totals.investment) / totals.income) * 100 : 0;
  const investRate = totals.income ? (totals.investment / totals.income) * 100 : 0;

  let title = "Seu mes esta em construcao";
  let copy = "Registre receitas, despesas e investimentos para entender o que ainda fica disponivel para movimentacao imediata.";
  if (transactions.length) {
    if (free < 0) {
      title = "Atencao ao saldo do mes";
      copy = `No ritmo atual, o mes fecha com ${money(Math.abs(free))} a menos no disponivel imediato. Revise gastos pendentes e categorias acima do limite.`;
    } else if (commitment > 80) {
      title = "Mes apertado, mas ainda controlavel";
      copy = `Voce ainda tem ${money(free)} disponivel para movimentacao e pode usar cerca de ${money(dailySafe)} por dia ate o fim do mes.`;
    } else {
      title = "Seu mes esta sob controle";
      copy = `Voce tem ${money(free)} disponivel para movimentacao, comprometeu ${commitment.toFixed(1)}% da receita e direcionou ${investRate.toFixed(1)}% para investimento.`;
    }
  }

  return {
    dailySafe: money(dailySafe),
    monthComparison: previousTotals.income || previousTotals.expense
      ? `${freeDelta >= 0 ? "+" : ""}${money(freeDelta)}`
      : "Sem historico",
    title,
    copy,
  };
}
