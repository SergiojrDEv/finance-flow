import type { GoalEntity } from "../../shared/applicationTypes.js";

export class GoalRepository {
  async save(_goal?: GoalEntity): Promise<GoalEntity> {
    throw new Error("GoalRepository.save precisa ser implementado.");
  }

  async update(_id?: string, _goal?: Partial<GoalEntity>): Promise<GoalEntity> {
    throw new Error("GoalRepository.update precisa ser implementado.");
  }

  async findById(_id?: string): Promise<GoalEntity | null> {
    throw new Error("GoalRepository.findById precisa ser implementado.");
  }

  async list(): Promise<GoalEntity[]> {
    throw new Error("GoalRepository.list precisa ser implementado.");
  }
}
