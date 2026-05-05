import assert from "node:assert/strict";
import test from "node:test";
import { CreateCategoryTagUseCase } from "../../../src/application/catalog/CreateCategoryTagUseCase.js";
import { InMemoryCategoryRepository } from "../../support/InMemoryCategoryRepository.js";
import { InMemoryCategoryTagRepository } from "../../support/InMemoryCategoryTagRepository.js";

const fixedClock = () => new Date("2026-04-25T10:00:00.000Z");

const category = {
  id: "cat-1",
  kind: "expense",
  slug: "alimentacao",
  name: "Alimentacao",
  color: "#c43d4b",
  isArchived: false,
};

test("cria etiqueta quando categoria principal existe", async () => {
  const categoryRepository = new InMemoryCategoryRepository([category]);
  const categoryTagRepository = new InMemoryCategoryTagRepository();
  const useCase = new CreateCategoryTagUseCase({ categoryRepository, categoryTagRepository, clock: fixedClock });

  const result = await useCase.execute({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante",
    color: "#c43d4b",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "tag-1");
  assert.equal(result.value.createdAt, "2026-04-25T10:00:00.000Z");
});

test("recusa etiqueta quando categoria principal nao existe", async () => {
  const categoryRepository = new InMemoryCategoryRepository([]);
  const categoryTagRepository = new InMemoryCategoryTagRepository();
  const useCase = new CreateCategoryTagUseCase({ categoryRepository, categoryTagRepository, clock: fixedClock });

  const result = await useCase.execute({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.categorySlug, "Categoria principal nao encontrada.");
});

test("recusa etiqueta duplicada na mesma categoria", async () => {
  const categoryRepository = new InMemoryCategoryRepository([category]);
  const categoryTagRepository = new InMemoryCategoryTagRepository([
    { id: "tag-1", kind: "expense", categorySlug: "alimentacao", slug: "restaurante", name: "Restaurante", isArchived: false },
  ]);
  const useCase = new CreateCategoryTagUseCase({ categoryRepository, categoryTagRepository, clock: fixedClock });

  const result = await useCase.execute({
    kind: "expense",
    categorySlug: "alimentacao",
    slug: "restaurante",
    name: "Restaurante novo",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.slug, "Etiqueta ja existe nesta categoria.");
});
