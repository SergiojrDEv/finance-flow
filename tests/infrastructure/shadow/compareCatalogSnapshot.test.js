import assert from "node:assert/strict";
import test from "node:test";
import { compareCatalogSnapshot } from "../../../src/infrastructure/shadow/compareCatalogSnapshot.js";

const catalog = {
  categories: [{ id: "cat-1", kind: "expense", slug: "pets", name: "Pets", color: "#0b7285", monthlyLimit: 200, isArchived: false }],
  tags: [{ id: "tag-1", kind: "expense", categorySlug: "pets", slug: "racao", name: "Racao", color: "#0b7285", isArchived: false }],
};

test("confirma catalogos equivalentes mesmo em ordem diferente", () => {
  const result = compareCatalogSnapshot({
    legacyCatalog: catalog,
    modernCatalog: { tags: [...catalog.tags], categories: [...catalog.categories] },
  });

  assert.equal(result.matched, true);
  assert.deepEqual(result.diffs, {});
});

test("aponta divergencia em categorias", () => {
  const result = compareCatalogSnapshot({
    legacyCatalog: catalog,
    modernCatalog: {
      ...catalog,
      categories: [{ ...catalog.categories[0], name: "Animais" }],
    },
  });

  assert.equal(result.matched, false);
  assert.ok(result.diffs.categories);
});
