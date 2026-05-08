import type { CategoryBudgetEntity } from "../../shared/applicationTypes.js";

export class CategoryBudgetRepository {
  async save(_budget?: CategoryBudgetEntity): Promise<CategoryBudgetEntity> {
    throw new Error("CategoryBudgetRepository.save precisa ser implementado.");
  }

  async findByCategorySlug(_categorySlug?: string): Promise<CategoryBudgetEntity | null> {
    throw new Error("CategoryBudgetRepository.findByCategorySlug precisa ser implementado.");
  }

  async update(_categorySlug?: string, _budget?: Partial<CategoryBudgetEntity>): Promise<CategoryBudgetEntity> {
    throw new Error("CategoryBudgetRepository.update precisa ser implementado.");
  }

  async list(): Promise<CategoryBudgetEntity[]> {
    throw new Error("CategoryBudgetRepository.list precisa ser implementado.");
  }
}
