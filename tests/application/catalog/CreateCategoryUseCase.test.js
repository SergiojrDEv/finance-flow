import assert from "node:assert/strict";
import test from "node:test";
import { CreateCategoryUseCase } from "../../../src/application/catalog/CreateCategoryUseCase.js";
import { InMemoryCategoryRepository } from "../../support/InMemoryCategoryRepository.js";

const fixedClock = () => new Date("2026-04-25T10:00:00.000Z");

test("cria categoria quando slug ainda nao existe no tipo", async () => {
  const repository = new InMemoryCategoryRepository();
  const useCase = new CreateCategoryUseCase({ categoryRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    kind: "expense",
    slug: "pets",
    name: "Pets",
    color: "#0b7285",
    monthlyLimit: 200,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "cat-1");
  assert.equal(result.value.createdAt, "2026-04-25T10:00:00.000Z");
});

test("recusa categoria duplicada no mesmo tipo", async () => {
  const repository = new InMemoryCategoryRepository([
    { id: "cat-1", kind: "expense", slug: "pets", name: "Pets", isArchived: false },
  ]);
  const useCase = new CreateCategoryUseCase({ categoryRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    kind: "expense",
    slug: "pets",
    name: "Pets novo",
    color: "#0b7285",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.slug, "Categoria ja existe para este tipo.");
});
