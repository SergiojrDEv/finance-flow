import assert from "node:assert/strict";
import test from "node:test";
import { createCatalogServices } from "../../../src/infrastructure/composition/createCatalogServices.js";
import { runCatalogShadow } from "../../../src/infrastructure/shadow/runCatalogShadow.js";

function createServices({ categories = [], tags = [] } = {}) {
  return createCatalogServices({
    readCategories: () => categories,
    writeCategories: (nextCategories) => {
      categories = nextCategories;
    },
    readTags: () => tags,
    writeTags: (nextTags) => {
      tags = nextTags;
    },
  });
}

const catalog = {
  categories: [{ id: "cat-1", kind: "expense", slug: "pets", name: "Pets", color: "#0b7285", monthlyLimit: 200, isArchived: false }],
  tags: [{ id: "tag-1", kind: "expense", categorySlug: "pets", slug: "racao", name: "Racao", color: "#0b7285", isArchived: false }],
};

test("nao executa quando flag esta desligada", async () => {
  const events = [];
  const result = await runCatalogShadow({
    enabled: false,
    catalog,
    catalogServices: createServices(catalog),
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.ran, false);
  assert.equal(events.length, 0);
});

test("executa sem diagnostico quando catalogos batem", async () => {
  const events = [];
  const result = await runCatalogShadow({
    enabled: true,
    catalog,
    catalogServices: createServices(catalog),
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.ran, true);
  assert.equal(result.matched, true);
  assert.equal(events.length, 0);
});

test("registra diagnostico quando catalogos divergem", async () => {
  const events = [];
  const result = await runCatalogShadow({
    enabled: true,
    catalog,
    catalogServices: createServices({ ...catalog, categories: [{ ...catalog.categories[0], name: "Animais" }] }),
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.matched, false);
  assert.equal(events.length, 1);
  assert.equal(events[0].scope, "catalog");
});
