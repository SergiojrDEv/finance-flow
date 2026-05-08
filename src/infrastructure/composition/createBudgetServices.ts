import { UpsertCategoryBudgetUseCase } from "../../application/budget/UpsertCategoryBudgetUseCase.js";
import { LocalCategoryBudgetRepository } from "../budget/LocalCategoryBudgetRepository.js";

type BudgetPeriodKind = "weekly" | "monthly";

type BudgetRow = {
  id: string | null;
  categorySlug: string;
  periodKind: BudgetPeriodKind;
  amount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CreateBudgetServicesDeps = {
  readBudgets?: () => BudgetRow[];
  writeBudgets?: (budgets: BudgetRow[]) => void;
  createId?: (categorySlug: string, periodKind: BudgetPeriodKind) => string;
  clock?: () => string;
};

export function createBudgetServices({
  readBudgets,
  writeBudgets,
  createId,
  clock,
}: CreateBudgetServicesDeps = {}) {
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
