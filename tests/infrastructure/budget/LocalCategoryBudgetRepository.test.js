import assert from "node:assert/strict";
import test from "node:test";
import { LocalCategoryBudgetRepository } from "../../../src/infrastructure/budget/LocalCategoryBudgetRepository.js";

test("mapeia linhas semanais e mensais para agregado de orcamento", async () => {
  let rows = [
    { id: "weekly", categorySlug: "alimentacao", periodKind: "weekly", amount: 300 },
    { id: "monthly", categorySlug: "alimentacao", periodKind: "monthly", amount: 1200 },
  ];
  const repository = new LocalCategoryBudgetRepository({
    readBudgets: () => rows,
    writeBudgets: (nextRows) => {
      rows = nextRows;
    },
  });

  const budget = await repository.findByCategorySlug("alimentacao");

  assert.equal(budget.weeklyLimit, 300);
  assert.equal(budget.monthlyLimit, 1200);
});

test("salva agregado preservando outras categorias", async () => {
  let rows = [{ id: "other", categorySlug: "moradia", periodKind: "monthly", amount: 2000 }];
  const repository = new LocalCategoryBudgetRepository({
    readBudgets: () => rows,
    writeBudgets: (nextRows) => {
      rows = nextRows;
    },
  });

  await repository.save({
    categorySlug: "alimentacao",
    weeklyLimit: 350,
    monthlyLimit: 1400,
    createdAt: "2026-05-06T10:00:00.000Z",
  });

  assert.equal(rows.length, 3);
  assert.equal(rows.find((item) => item.categorySlug === "moradia").amount, 2000);
  assert.equal(rows.find((item) => item.categorySlug === "alimentacao" && item.periodKind === "weekly").amount, 350);
  assert.equal(rows.find((item) => item.categorySlug === "alimentacao" && item.periodKind === "monthly").amount, 1400);
});
