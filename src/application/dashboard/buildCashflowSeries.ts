import { buildFinancialSummary } from "./buildFinancialSummary.js";

interface CashflowTransaction {
  date?: string | null;
  type?: string;
  amount?: number | string | null;
  category?: string | null;
}

interface CashflowSeriesInput {
  transactions?: CashflowTransaction[];
  currentDate?: Date;
  monthCount?: number;
  locale?: string;
}

interface CashflowSeriesPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
  investment: number;
  free: number;
}

function parseTransactionMonth(value: CashflowTransaction["date"]): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value.slice(0, 7);
}

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "short" });
}

export function buildCashflowSeries({
  transactions = [],
  currentDate = new Date(),
  monthCount = 6,
  locale = "pt-BR",
}: CashflowSeriesInput = {}): CashflowSeriesPoint[] {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeMonthCount = Math.max(1, Number(monthCount) || 1);

  return Array.from({ length: safeMonthCount }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (safeMonthCount - 1 - index), 1);
    const key = monthKey(date);
    const monthTransactions = safeTransactions.filter((item) => parseTransactionMonth(item?.date) === key);
    const summary = buildFinancialSummary(monthTransactions);

    return {
      key,
      label: monthLabel(date, locale),
      income: summary.totals.income,
      expense: summary.totals.expenses,
      investment: summary.totals.investments,
      free: summary.totals.available,
    };
  });
}
