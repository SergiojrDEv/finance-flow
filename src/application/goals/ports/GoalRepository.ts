export class GoalRepository {
  async save(): Promise<unknown> {
    throw new Error("GoalRepository.save precisa ser implementado.");
  }

  async update(): Promise<unknown> {
    throw new Error("GoalRepository.update precisa ser implementado.");
  }

  async findById(): Promise<unknown> {
    throw new Error("GoalRepository.findById precisa ser implementado.");
  }

  async list(): Promise<unknown> {
    throw new Error("GoalRepository.list precisa ser implementado.");
  }
}
