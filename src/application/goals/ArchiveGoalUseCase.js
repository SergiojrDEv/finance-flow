export class ArchiveGoalUseCase {
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

  async execute(id) {
    const existing = await this.goalRepository.findById(id);
    if (!existing) {
      return {
        ok: false,
        errors: { id: "Meta nao encontrada." },
      };
    }

    return {
      ok: true,
      value: await this.goalRepository.update(id, {
        ...existing,
        isArchived: true,
        updatedAt: this.clock().toISOString(),
      }),
    };
  }
}
