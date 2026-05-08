interface DashboardInsightTransaction {
  status?: string;
  dueDate?: string | null;
  description?: string;
  amount?: number | string | null;
  type?: string;
  category?: string | null;
}

type ExpenseCategoryTuple = [key: string, label: string, color?: string, limit?: number | string | null];

interface DashboardInsightBudgetRule {
  monthly?: number | string | null;
}

interface DashboardInsightTotals {
  income?: number;
  investment?: number;
}

interface DashboardInsightsInput {
  transactions?: DashboardInsightTransaction[];
  expenseCategories?: ExpenseCategoryTuple[];
  budgetRules?: Record<string, DashboardInsightBudgetRule>;
  totals?: DashboardInsightTotals;
  today?: Date;
}

type DashboardInsight =
  | {
      kind: "due";
      label: string;
      description?: string;
      amount: number;
    }
  | {
      kind: "budget";
      label: "Orcamento estourado" | "Perto do limite";
      description: string;
      amount: number;
      threshold: number;
    }
  | {
      kind: "investment";
      label: "Boa disciplina";
      investmentRate: number;
    };

function toAmount(value: number | string | null | undefined): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function daysBetween(dateValue: string, today: Date): number {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const reference = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((due.getTime() - reference.getTime()) / 86400000);
}

export function buildDashboardInsights({
  transactions = [],
  expenseCategories = [],
  budgetRules = {},
  totals = {},
  today = new Date(),
}: DashboardInsightsInput = {}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const pending = transactions
    .filter((item) => item?.status !== "paid" && item?.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 3);

  pending.forEach((item) => {
    if (!item.dueDate) return;

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

  const income = toAmount(totals.income);
  const investment = toAmount(totals.investment);

  if (income && investment / income >= 0.1) {
    insights.push({
      kind: "investment",
      label: "Boa disciplina",
      investmentRate: (investment / income) * 100,
    });
  }

  return insights;
}
