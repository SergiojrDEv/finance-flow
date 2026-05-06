import { Goal } from "../../domain/goals/Goal.js";

export class UpdateGoalUseCase {
  constructor({ goalRepository, clock = () => new Date() } = {}) {
    if (!goalRepository || typeof goalRepository.findById !== "function") {
      throw new Error("goalRepository.findById e obrigatorio.");
    }
    if (typeof goalRepository.update !== "function") {
      throw new Error("goalRepository.update e obrigatorio.");
    }

    this.goalRepository = goalRepository;
    this.clock = clock;
  }

  async execute(id, draft) {
    const existing = await this.goalRepository.findById(id);
    if (!existing) {
      return {
        ok: false,
        errors: { id: "Meta nao encontrada." },
      };
    }

    const creation = Goal.create({
      ...existing,
      ...draft,
      id: existing.id,
      currentAmount: existing.currentAmount,
      color: draft.color || existing.color,
      createdAt: existing.createdAt,
      updatedAt: this.clock().toISOString(),
    });

    if (!creation.ok) {
      return {
        ok: false,
        errors: creation.errors,
      };
    }

    return {
      ok: true,
      value: await this.goalRepository.update(id, creation.value),
    };
  }
}
