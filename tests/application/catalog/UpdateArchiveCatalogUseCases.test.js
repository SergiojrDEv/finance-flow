import assert from "node:assert/strict";
import test from "node:test";
import { ArchiveCategoryTagUseCase } from "../../../src/application/catalog/ArchiveCategoryTagUseCase.js";
import { ArchiveCategoryUseCase } from "../../../src/application/catalog/ArchiveCategoryUseCase.js";
import { UpdateCategoryTagUseCase } from "../../../src/application/catalog/UpdateCategoryTagUseCase.js";
import { UpdateCategoryUseCase } from "../../../src/application/catalog/UpdateCategoryUseCase.js";
import { InMemoryCategoryRepository } from "../../support/InMemoryCategoryRepository.js";
import { InMemoryCategoryTagRepository } from "../../support/InMemoryCategoryTagRepository.js";

const fixedClock = () => new Date("2026-04-26T10:00:00.000Z");

test("edita categoria preservando tipo e slug", async () => {
  const repository = new InMemoryCategoryRepository([
    { id: "cat-1", kind: "expense", slug: "pets", name: "Pets", color: "#667085", monthlyLimit: 100, isArchived: false },
  ]);
  const useCase = new UpdateCategoryUseCase({ categoryRepository: repository, clock: fixedClock });

  const result = await useCase.execute("cat-1", { name: "Animais", color: "#0b7285", monthlyLimit: 200 });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Animais");
  assert.equal(result.value.slug, "pets");
  assert.equal(result.value.updatedAt, "2026-04-26T10:00:00.000Z");
});

test("arquiva categoria sem remover fisicamente", async () => {
  const repository = new InMemoryCategoryRepository([
    { id: "cat-1", kind: "expense", slug: "pets", name: "Pets", color: "#667085", monthlyLimit: 100, isArchived: false },
  ]);
  const useCase = new ArchiveCategoryUseCase({ categoryRepository: repository, clock: fixedClock });

  const result = await useCase.execute("cat-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.isArchived, true);
  assert.equal((await repository.list()).length, 1);
});

test("edita etiqueta preservando tipo categoria e slug", async () => {
  const repository = new InMemoryCategoryTagRepository([
    { id: "tag-1", kind: "expense", categorySlug: "alimentacao", slug: "restaurante", name: "Restaurante", color: "#667085", isArchived: false },
  ]);
  const useCase = new UpdateCategoryTagUseCase({ categoryTagRepository: repository, clock: fixedClock });

  const result = await useCase.execute("tag-1", { name: "Restaurantes", color: "#c43d4b" });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Restaurantes");
  assert.equal(result.value.categorySlug, "alimentacao");
  assert.equal(result.value.slug, "restaurante");
});

test("arquiva etiqueta sem remover fisicamente", async () => {
  const repository = new InMemoryCategoryTagRepository([
    { id: "tag-1", kind: "expense", categorySlug: "alimentacao", slug: "restaurante", name: "Restaurante", color: "#667085", isArchived: false },
  ]);
  const useCase = new ArchiveCategoryTagUseCase({ categoryTagRepository: repository, clock: fixedClock });

  const result = await useCase.execute("tag-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.isArchived, true);
  assert.equal((await repository.list()).length, 1);
});
