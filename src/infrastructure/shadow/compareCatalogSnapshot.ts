type CatalogItem = Record<string, unknown>;
type CatalogSnapshot = {
  categories?: CatalogItem[];
  tags?: CatalogItem[];
};

type CatalogDiff = {
  legacy: CatalogItem[];
  modern: CatalogItem[];
};

type CatalogComparison = {
  matched: boolean;
  diffs: {
    categories?: CatalogDiff;
    tags?: CatalogDiff;
  };
};

function normalizeItems(items: CatalogItem[] = [], fields: string[] = []): CatalogItem[] {
  return items
    .map((item) => fields.reduce<CatalogItem>((acc, field) => {
      acc[field] = item?.[field] ?? null;
      return acc;
    }, {}))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function diffList(legacy: CatalogItem[], modern: CatalogItem[]): CatalogDiff | null {
  const legacyJson = JSON.stringify(legacy);
  const modernJson = JSON.stringify(modern);
  if (legacyJson === modernJson) return null;
  return {
    legacy,
    modern,
  };
}

export function compareCatalogSnapshot({
  legacyCatalog = {},
  modernCatalog = {},
}: {
  legacyCatalog?: CatalogSnapshot;
  modernCatalog?: CatalogSnapshot;
} = {}): CatalogComparison {
  const legacyCategories = normalizeItems(legacyCatalog.categories, ["id", "kind", "slug", "name", "color", "monthlyLimit", "isArchived"]);
  const modernCategories = normalizeItems(modernCatalog.categories, ["id", "kind", "slug", "name", "color", "monthlyLimit", "isArchived"]);
  const legacyTags = normalizeItems(legacyCatalog.tags, ["id", "kind", "categorySlug", "slug", "name", "color", "isArchived"]);
  const modernTags = normalizeItems(modernCatalog.tags, ["id", "kind", "categorySlug", "slug", "name", "color", "isArchived"]);

  const diffs: CatalogComparison["diffs"] = {};
  const categoryDiff = diffList(legacyCategories, modernCategories);
  const tagDiff = diffList(legacyTags, modernTags);

  if (categoryDiff) diffs.categories = categoryDiff;
  if (tagDiff) diffs.tags = tagDiff;

  return {
    matched: Object.keys(diffs).length === 0,
    diffs,
  };
}
