function toAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildDailyHistory(transactions = []) {
  const grouped = new Map();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  safeTransactions
    .slice()
    .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")) || String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")))
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
