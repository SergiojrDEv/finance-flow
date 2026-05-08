import type { FinancialHealth, FinancialSummary, TransactionDraft } from "../shared/applicationTypes.js";

type FinancialTransaction = Pick<TransactionDraft, "type" | "amount" | "category">;

function toAmount(value: FinancialTransaction["amount"]): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumByType(transactions: FinancialTransaction[], type: string): number {
  return transactions
    .filter((item) => item?.type === type)
    .reduce((sum, item) => sum + toAmount(item.amount), 0);
}

function countExpenseCategories(transactions: FinancialTransaction[]): number {
  return new Set(
    transactions
      .filter((item) => item?.type === "expense")
      .map((item) => item.category)
      .filter(Boolean)
  ).size;
}

function buildHealth({
  income,
  expenses,
  investments,
  available,
  hasTransactions,
}: {
  income: number;
  expenses: number;
  investments: number;
  available: number;
  hasTransactions: boolean;
}): FinancialHealth {
  if (!hasTransactions) {
    return {
      score: 0,
      status: "empty",
      copy: "Adicione receitas, despesas e investimentos para medir o saldo disponivel do mes.",
    };
  }

  if (!income) {
    return {
      score: investments > 0 ? 40 : 18,
      status: "missing-income",
      copy: "Ja da para ler os movimentos do mes, mas registrar receitas deixa o saldo disponivel mais preciso.",
    };
  }

  const commitmentRate = ((expenses + investments) / income) * 100;
  const investmentRate = (investments / income) * 100;
  const headroom = Math.max(0, 100 - commitmentRate);
  let score = 58 + Math.min(22, headroom * 0.3) + Math.min(12, investmentRate * 0.45);

  if (commitmentRate > 78) score -= (commitmentRate - 78) * 0.45;
  if (commitmentRate > 92) score -= (commitmentRate - 92) * 0.4;

  if (available < 0) {
    const negativeRatio = Math.abs(available) / Math.max(1, income);
    score -= Math.min(18, negativeRatio * 42);
  } else {
    score += Math.min(8, available / Math.max(180, income * 0.05));
  }

  const minimum = commitmentRate > 100 ? 12 : 18;
  const normalizedScore = Math.round(Math.max(minimum, Math.min(96, score)));

  if (available < 0) {
    return {
      score: normalizedScore,
      status: "negative",
      copy: `Mes no vermelho: faltam ${roundMoney(Math.abs(available))} para o disponivel imediato fechar positivo.`,
    };
  }

  if (normalizedScore >= 70) {
    return {
      score: normalizedScore,
      status: "healthy",
      copy: "Bom equilibrio entre gastos, reserva e disponivel para movimentacao.",
    };
  }

  return {
    score: normalizedScore,
    status: "attention",
    copy: "Revise os maiores gastos e proteja o valor ainda disponivel para movimentacao.",
  };
}

export function buildFinancialSummary(transactions: FinancialTransaction[] = []): FinancialSummary {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const income = roundMoney(sumByType(safeTransactions, "income"));
  const expenses = roundMoney(sumByType(safeTransactions, "expense"));
  const investments = roundMoney(sumByType(safeTransactions, "investment"));
  const available = roundMoney(income - expenses - investments);
  const hasTransactions = safeTransactions.length > 0;
  const investmentRate = income ? roundMoney((investments / income) * 100) : 0;
  const commitmentRate = income ? roundMoney(((expenses + investments) / income) * 100) : 0;

  return {
    totals: {
      income,
      expenses,
      investments,
      available,
    },
    counts: {
      transactions: safeTransactions.length,
      income: safeTransactions.filter((item) => item?.type === "income").length,
      expenseCategories: countExpenseCategories(safeTransactions),
      investments: safeTransactions.filter((item) => item?.type === "investment").length,
    },
    rates: {
      investmentRate,
      commitmentRate,
    },
    health: buildHealth({ income, expenses, investments, available, hasTransactions }),
  };
}
