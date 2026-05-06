import { CategoryBudget } from "../../domain/budget/CategoryBudget.js";
import { fail, ok } from "../shared/result.js";

export class UpsertCategoryBudgetUseCase {
  constructor({ categoryBudgetRepository, clock = () => new Date() } = {}) {
    if (!categoryBudgetRepository || typeof categoryBudgetRepository.findByCategorySlug !== "function") {
      throw new Error("categoryBudgetRepository.findByCategorySlug e obrigatorio.");
    }
    if (typeof categoryBudgetRepository.save !== "function") {
      throw new Error("categoryBudgetRepository.save e obrigatorio.");
    }
    if (typeof categoryBudgetRepository.update !== "function") {
      throw new Error("categoryBudgetRepository.update e obrigatorio.");
    }

    this.categoryBudgetRepository = categoryBudgetRepository;
    this.clock = clock;
  }

  async execute(draft) {
    const existing = await this.categoryBudgetRepository.findByCategorySlug(draft.categorySlug);
    const now = this.clock().toISOString();
    const creation = CategoryBudget.create({
      ...existing,
      ...draft,
      id: existing?.id || draft.id || null,
      createdAt: existing?.createdAt || draft.createdAt || now,
      updatedAt: now,
    });

    if (!creation.ok) {
      return fail(creation.errors);
    }

    const saved = existing
      ? await this.categoryBudgetRepository.update(existing.id, creation.value)
      : await this.categoryBudgetRepository.save(creation.value);

    return ok(saved, { action: existing ? "updated" : "created" });
  }
}
