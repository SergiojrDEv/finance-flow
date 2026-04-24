export function buildCategoryBreakdown(transactions, categories) {
  const bySlug = new Map((categories || []).map((item) => [item.slug, item]));
  const rows = new Map();

  transactions
    .filter((item) => item.kind === "expense")
    .forEach((item) => {
      const category = bySlug.get(item.categorySlug);
      const key = category?.slug || item.categorySlug || "outros";
      const previous = rows.get(key);

      rows.set(key, {
        categorySlug: category?.slug || item.categorySlug || "outros",
        categoryName: category?.name || item.categoryName || "Outros",
        color: category?.color || item.color || "#667085",
        total: (previous?.total || 0) + item.amount,
      });
    });

  return Array.from(rows.values()).sort((left, right) => right.total - left.total);
}
