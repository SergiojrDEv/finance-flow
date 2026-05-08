interface DailyHistoryTransaction {
  date?: string | null;
  createdAt?: string | null;
  type?: string;
  amount?: number | string | null;
  [key: string]: unknown;
}

interface DailyHistoryGroup {
  date: string;
  items: DailyHistoryTransaction[];
  count: number;
  totals: {
    income: number;
    outflow: number;
  };
}

function toAmount(value: DailyHistoryTransaction["amount"]): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildDailyHistory(transactions: DailyHistoryTransaction[] = []): DailyHistoryGroup[] {
  const grouped = new Map<string, DailyHistoryTransaction[]>();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  safeTransactions
    .slice()
    .sort(
      (a, b) =>
        String(b?.date || "").localeCompare(String(a?.date || "")) ||
        String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
    )
    .forEach((item) => {
      const date = item?.date || "";
      if (!date) return;
      grouped.set(date, [...(grouped.get(date) || []), item]);
    });

  return Array.from(grouped.entries()).map(([date, items]) => {
    const income = items
      .filter((item) => item?.type === "income")
      .reduce((sum, item) => sum + toAmount(item.amount), 0);
    const outflow = items
      .filter((item) => item?.type !== "income")
      .reduce((sum, item) => sum + toAmount(item.amount), 0);

    return {
      date,
      items,
      count: items.length,
      totals: {
        income: roundMoney(income),
        outflow: roundMoney(outflow),
      },
    };
  });
}
