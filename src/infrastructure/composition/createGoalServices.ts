import { ArchiveGoalUseCase } from "../../application/goals/ArchiveGoalUseCase.js";
import { CreateGoalUseCase } from "../../application/goals/CreateGoalUseCase.js";
import { UpdateGoalUseCase } from "../../application/goals/UpdateGoalUseCase.js";
import { LocalGoalRepository } from "../goals/LocalGoalRepository.js";
import type { GoalEntity } from "../../application/shared/applicationTypes.js";

type CreateGoalServicesDeps = {
  readGoals?: () => GoalEntity[];
  writeGoals?: (goals: GoalEntity[]) => void;
  createId?: (goal: GoalEntity) => string;
  clock?: () => string;
};

export function createGoalServices({
  readGoals,
  writeGoals,
  createId,
  clock,
}: CreateGoalServicesDeps = {}) {
  const goalRepository = new LocalGoalRepository({
    readGoals,
    writeGoals,
    createId,
  });

  return {
    goalRepository,
    createGoal: new CreateGoalUseCase({ goalRepository, clock }),
    updateGoal: new UpdateGoalUseCase({ goalRepository, clock }),
    archiveGoal: new ArchiveGoalUseCase({ goalRepository, clock }),
  };
}
