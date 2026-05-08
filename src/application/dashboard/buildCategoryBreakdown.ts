import type { CategoryBreakdownRow, CategoryTuple, TransactionDraft } from "../shared/applicationTypes.js";

type CategoryBreakdownTransaction = Pick<TransactionDraft, "type" | "amount" | "category">;

interface CategoryBreakdownInput {
  transactions?: CategoryBreakdownTransaction[];
  categories?: CategoryTuple[];
}

function toAmount(value: CategoryBreakdownTransaction["amount"]): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function buildCategoryBreakdown({
  transactions = [],
  categories = [],
}: CategoryBreakdownInput = {}): CategoryBreakdownRow[] {
  const categoryByKey = new Map(categories.map(([key, label, color]) => [key, { label, color }]));
  const totals = transactions
    .filter((item) => item?.type === "expense")
    .reduce<Record<string, number>>((acc, item) => {
      const categoryKey = String(item.category);

      acc[categoryKey] = (acc[categoryKey] || 0) + toAmount(item.amount);
      return acc;
    }, {});
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, value]) => value), 0);

  return rows.map(([key, value]) => {
    const category = categoryByKey.get(key) || { label: key, color: "#667085" };
    return {
      key,
      label: category.label,
      color: category.color,
      value,
      width: max ? (value / max) * 100 : 0,
    };
  });
}
