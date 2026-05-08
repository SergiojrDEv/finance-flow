import { GoalRepository } from "../../application/goals/ports/GoalRepository.js";
import type { GoalEntity } from "../../application/shared/applicationTypes.js";

type SerializableGoal = GoalEntity & {
  toJSON?: () => GoalEntity;
};

type LocalGoalRepositoryDeps = {
  readGoals?: () => GoalEntity[];
  writeGoals?: (goals: GoalEntity[]) => void;
  createId?: (goal: GoalEntity) => string;
};

function defaultCreateId(goal: GoalEntity): string {
  return `goal:${goal.key}:${String(goal.name || "").toLowerCase()}`;
}

function serializeGoal(goal: SerializableGoal): GoalEntity {
  return typeof goal.toJSON === "function" ? goal.toJSON() : { ...goal };
}

export class LocalGoalRepository extends GoalRepository {
  private readonly readGoals: () => GoalEntity[];
  private readonly writeGoals: (goals: GoalEntity[]) => void;
  private readonly createId: (goal: GoalEntity) => string;

  constructor({ readGoals, writeGoals, createId = defaultCreateId }: LocalGoalRepositoryDeps = {}) {
    super();

    if (typeof readGoals !== "function") {
      throw new Error("readGoals e obrigatorio.");
    }

    if (typeof writeGoals !== "function") {
      throw new Error("writeGoals e obrigatorio.");
    }

    this.readGoals = readGoals;
    this.writeGoals = writeGoals;
    this.createId = createId;
  }

  async save(goal: GoalEntity): Promise<GoalEntity> {
    const saved = {
      ...serializeGoal(goal),
      id: goal.id || this.createId(goal),
    };

    this.writeGoals([...this.readGoals(), saved]);
    return saved;
  }

  async update(id: string, goal: GoalEntity): Promise<GoalEntity | null> {
    const goals = this.readGoals();
    const index = goals.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const saved = {
      ...serializeGoal(goal),
      id,
    };
    const nextGoals = [...goals];
    nextGoals[index] = saved;
    this.writeGoals(nextGoals);
    return saved;
  }

  async findById(id: string): Promise<GoalEntity | null> {
    return this.readGoals().find((goal) => goal.id === id) || null;
  }

  async list(): Promise<GoalEntity[]> {
    return [...this.readGoals()];
  }
}
