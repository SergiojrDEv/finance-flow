import assert from "node:assert/strict";
import test from "node:test";
import { createCatalogServices } from "../../../src/infrastructure/composition/createCatalogServices.js";

function createCatalogStore() {
  let categories = [];
  let tags = [];
  return {
    readCategories: () => categories,
    writeCategories: (nextCategories) => {
      categories = nextCategories;
    },
    readTags: () => tags,
    writeTags: (nextTags) => {
      tags = nextTags;
    },
    snapshot: () => ({ categories, tags }),
  };
}

const fixedClock = () => new Date("2026-04-26T10:00:00.000Z");

test("monta servicos de catalogo com repositorios locais", async () => {
  const store = createCatalogStore();
  const services = createCatalogServices({
    ...store,
    createCategoryId: () => "cat-1",
    createTagId: () => "tag-1",
    clock: fixedClock,
  });

  const category = await services.createCategory.execute({
    kind: "expense",
    slug: "pets",
    name: "Pets",
    color: "#0b7285",
    monthlyLimit: 200,
  });
  const tag = await services.createCategoryTag.execute({
    kind: "expense",
    categorySlug: "pets",
    slug: "racao",
    name: "Racao",
    color: "#0b7285",
  });

  assert.equal(category.ok, true);
  assert.equal(tag.ok, true);
  assert.deepEqual(store.snapshot().categories.map((item) => item.id), ["cat-1"]);
  assert.deepEqual(store.snapshot().tags.map((item) => item.id), ["tag-1"]);
});

test("servicos de catalogo editam e arquivam itens", async () => {
  const store = createCatalogStore();
  const services = createCatalogServices({
    ...store,
    createCategoryId: () => "cat-1",
    createTagId: () => "tag-1",
    clock: fixedClock,
  });

  await services.createCategory.execute({ kind: "expense", slug: "pets", name: "Pets", color: "#0b7285" });
  await services.createCategoryTag.execute({ kind: "expense", categorySlug: "pets", slug: "racao", name: "Racao", color: "#0b7285" });

  const updatedCategory = await services.updateCategory.execute("cat-1", { name: "Animais", color: "#1971c2" });
  const archivedTag = await services.archiveCategoryTag.execute("tag-1");

  assert.equal(updatedCategory.value.name, "Animais");
  assert.equal(archivedTag.value.isArchived, true);
});

test("propaga erro quando dependencias locais de categoria nao existem", () => {
  assert.throws(
    () => createCatalogServices({ readCategories: () => [], readTags: () => [], writeTags: () => {} }),
    /writeCategories e obrigatorio/
  );
});
