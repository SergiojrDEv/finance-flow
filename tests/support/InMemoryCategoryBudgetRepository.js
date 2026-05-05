import { CategoryBudgetRepository } from "../../src/application/budget/ports/CategoryBudgetRepository.js";

export class InMemoryCategoryBudgetRepository extends CategoryBudgetRepository {
  constructor(initialBudgets = []) {
    super();
    this.budgets = [...initialBudgets];
  }

  async save(budget) {
    const saved = {
      ...budget.toJSON(),
      id: budget.id || `budget-${this.budgets.length + 1}`,
    };
    this.budgets.push(saved);
    return saved;
  }

  async findByCategorySlug(categorySlug) {
    return this.budgets.find((budget) => budget.categorySlug === categorySlug) || null;
  }

  async update(id, budget) {
    const index = this.budgets.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const saved = typeof budget.toJSON === "function" ? budget.toJSON() : { ...budget };
    saved.id = id;
    this.budgets[index] = saved;
    return saved;
  }

  async list() {
    return [...this.budgets];
  }
}
