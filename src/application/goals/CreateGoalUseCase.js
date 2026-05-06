import { Goal } from "../../domain/goals/Goal.js";
import { fail, ok } from "../shared/result.js";

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
      return fail(creation.errors);
    }

    return ok(await this.goalRepository.save(creation.value));
  }
}
