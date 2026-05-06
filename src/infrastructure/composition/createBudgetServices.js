import { UpsertCategoryBudgetUseCase } from "../../application/budget/UpsertCategoryBudgetUseCase.js";
import { LocalCategoryBudgetRepository } from "../budget/LocalCategoryBudgetRepository.js";

export function createBudgetServices({
  readBudgets,
  writeBudgets,
  createId,
  clock,
} = {}) {
  const categoryBudgetRepository = new LocalCategoryBudgetRepository({
    readBudgets,
    writeBudgets,
    createId,
  });

  return {
    categoryBudgetRepository,
    upsertCategoryBudget: new UpsertCategoryBudgetUseCase({
      categoryBudgetRepository,
      clock,
    }),
  };
}
