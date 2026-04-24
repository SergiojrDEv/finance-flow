export function mapCategoryRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    slug: row.slug,
    name: row.name,
    color: row.color || "#667085",
    monthlyLimit: row.monthly_limit == null ? null : Number(row.monthly_limit),
    isArchived: Boolean(row.is_archived),
  };
}

export function mapCategoryTagRow(row, categoryById = new Map()) {
  const category = categoryById.get(row.category_id);
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categorySlug: category?.slug || "",
    kind: category?.kind || "expense",
    slug: row.slug,
    name: row.name,
    color: row.color || category?.color || "#667085",
    isArchived: Boolean(row.is_archived),
  };
}
