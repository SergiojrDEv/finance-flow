export function buildFinancialHealth({ income, expense, investment, hasTransactions }) {
  const availableBalance = income - expense - investment;
  const commitmentRate = income > 0 ? ((expense + investment) / income) * 100 : 0;
  const investmentRate = income > 0 ? (investment / income) * 100 : 0;

  let score = 0;
  let copy = "Adicione receitas, despesas e investimentos para medir o saldo disponivel do mes.";

  if (income) {
    const commitmentGap = commitmentRate - 100;
    const healthyHeadroom = Math.max(0, 100 - commitmentRate);
    score = 58 + Math.min(22, healthyHeadroom * 0.3) + Math.min(12, investmentRate * 0.45);
    if (commitmentRate > 78) score -= (commitmentRate - 78) * 0.45;
    if (commitmentRate > 92) score -= (commitmentRate - 92) * 0.4;
    if (commitmentGap > 0) score -= Math.min(18, commitmentGap * 0.42);
    if (availableBalance >= 0) {
      score += Math.min(8, availableBalance / Math.max(180, income * 0.05));
    } else {
      const negativeRatio = Math.abs(availableBalance) / Math.max(1, income);
      score -= Math.min(16, negativeRatio * 42);
    }
    score = Math.max(commitmentGap > 0 ? 12 : 18, Math.min(96, score));
    copy = availableBalance < 0
      ? `Mes no vermelho: depois de despesas e investimentos, faltam ${Math.abs(availableBalance)} para o disponivel imediato fechar positivo.`
      : score >= 70
        ? "Bom equilibrio entre gastos, reserva e disponivel para movimentacao."
        : "Revise os maiores gastos e proteja o valor ainda disponivel para movimentacao.";
  } else if (hasTransactions) {
    score = Math.max(
      12,
      Math.min(58, investment > 0 ? 36 + Math.min(22, investment / 100) : 18 - Math.min(8, expense / 500))
    );
    copy = "Ja da para ler os movimentos do mes, mas registrar receitas deixa o saldo disponivel mais preciso.";
  }

  return {
    score: Math.round(score),
    availableBalance,
    commitmentRate,
    investmentRate,
    copy,
  };
}
