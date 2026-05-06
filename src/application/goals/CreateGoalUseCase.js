import { Goal } from "../../domain/goals/Goal.js";

export class CreateGoalUseCase {
  constructor({ goalRepository, clock = () => new Date() } = {}) {
    if (!goalRepository || typeof goalRepository.save !== "function") {
      throw new Error("goalRepository.save e obrigatorio.");
    }

    this.goalRepository = goalRepository;
    this.clock = clock;
  }

  async execute(draft) {
    const now = this.clock().toISOString();
    const creation = Goal.create({
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
    });

    if (!creation.ok) {
      return {
        ok: false,
        errors: creation.errors,
      };
    }

    return {
      ok: true,
      value: await this.goalRepository.save(creation.value),
    };
  }
}
