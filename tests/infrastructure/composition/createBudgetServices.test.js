import assert from "node:assert/strict";
import test from "node:test";
import { createBudgetServices } from "../../../src/infrastructure/composition/createBudgetServices.js";

test("monta servico de orcamento com repositorio local", async () => {
  let rows = [];
  const services = createBudgetServices({
    readBudgets: () => rows,
    writeBudgets: (nextRows) => {
      rows = nextRows;
    },
    clock: () => new Date("2026-05-06T10:00:00.000Z"),
  });

  const result = await services.upsertCategoryBudget.execute({
    categorySlug: "alimentacao",
    weeklyLimit: 350,
    monthlyLimit: 1400,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.weeklyLimit, 350);
  assert.equal(rows.length, 2);
  assert.equal(typeof services.categoryBudgetRepository.findByCategorySlug, "function");
});
