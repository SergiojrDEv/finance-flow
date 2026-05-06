import { GoalRepository } from "../../application/goals/ports/GoalRepository.js";

function defaultCreateId(goal) {
  return `goal:${goal.key}:${String(goal.name || "").toLowerCase()}`;
}

function serializeGoal(goal) {
  return typeof goal.toJSON === "function" ? goal.toJSON() : { ...goal };
}

export class LocalGoalRepository extends GoalRepository {
  constructor({ readGoals, writeGoals, createId = defaultCreateId } = {}) {
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

  async save(goal) {
    const saved = {
      ...serializeGoal(goal),
      id: goal.id || this.createId(goal),
    };

    this.writeGoals([...this.readGoals(), saved]);
    return saved;
  }

  async update(id, goal) {
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

  async findById(id) {
    return this.readGoals().find((goal) => goal.id === id) || null;
  }

  async list() {
    return [...this.readGoals()];
  }
}
