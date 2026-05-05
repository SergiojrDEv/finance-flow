import assert from "node:assert/strict";
import test from "node:test";
import { UpsertCategoryBudgetUseCase } from "../../../src/application/budget/UpsertCategoryBudgetUseCase.js";
import { InMemoryCategoryBudgetRepository } from "../../support/InMemoryCategoryBudgetRepository.js";

const fixedClock = () => new Date("2026-04-26T10:00:00.000Z");

test("cria orcamento quando categoria ainda nao possui regra", async () => {
  const repository = new InMemoryCategoryBudgetRepository();
  const useCase = new UpsertCategoryBudgetUseCase({ categoryBudgetRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    categorySlug: "alimentacao",
    weeklyLimit: 350,
    monthlyLimit: 1400,
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, "created");
  assert.equal(result.value.id, "budget-1");
  assert.equal(result.value.createdAt, "2026-04-26T10:00:00.000Z");
});

test("atualiza orcamento existente preservando createdAt", async () => {
  const repository = new InMemoryCategoryBudgetRepository([
    { id: "budget-1", categorySlug: "alimentacao", weeklyLimit: 300, monthlyLimit: 1200, createdAt: "2026-04-01T00:00:00.000Z" },
  ]);
  const useCase = new UpsertCategoryBudgetUseCase({ categoryBudgetRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    categorySlug: "alimentacao",
    weeklyLimit: 350,
    monthlyLimit: 1400,
  });

  assert.equal(result.ok, true);
  assert.equal(result.action, "updated");
  assert.equal(result.value.id, "budget-1");
  assert.equal(result.value.createdAt, "2026-04-01T00:00:00.000Z");
  assert.equal(result.value.updatedAt, "2026-04-26T10:00:00.000Z");
});
