function normalizeItems(items = [], fields = []) {
  return items
    .map((item) => fields.reduce((acc, field) => {
      acc[field] = item?.[field] ?? null;
      return acc;
    }, {}))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function diffList(legacy, modern) {
  const legacyJson = JSON.stringify(legacy);
  const modernJson = JSON.stringify(modern);
  if (legacyJson === modernJson) return null;
  return {
    legacy,
    modern,
  };
}

export function compareCatalogSnapshot({ legacyCatalog = {}, modernCatalog = {} } = {}) {
  const legacyCategories = normalizeItems(legacyCatalog.categories, ["id", "kind", "slug", "name", "color", "monthlyLimit", "isArchived"]);
  const modernCategories = normalizeItems(modernCatalog.categories, ["id", "kind", "slug", "name", "color", "monthlyLimit", "isArchived"]);
  const legacyTags = normalizeItems(legacyCatalog.tags, ["id", "kind", "categorySlug", "slug", "name", "color", "isArchived"]);
  const modernTags = normalizeItems(modernCatalog.tags, ["id", "kind", "categorySlug", "slug", "name", "color", "isArchived"]);

  const diffs = {};
  const categoryDiff = diffList(legacyCategories, modernCategories);
  const tagDiff = diffList(legacyTags, modernTags);

  if (categoryDiff) diffs.categories = categoryDiff;
  if (tagDiff) diffs.tags = tagDiff;

  return {
    matched: Object.keys(diffs).length === 0,
    diffs,
  };
}
