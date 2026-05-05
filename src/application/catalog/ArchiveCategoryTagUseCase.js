export class ArchiveCategoryTagUseCase {
  constructor({ categoryTagRepository, clock = () => new Date() } = {}) {
    if (!categoryTagRepository || typeof categoryTagRepository.findById !== "function") {
      throw new Error("categoryTagRepository.findById e obrigatorio.");
    }
    if (typeof categoryTagRepository.update !== "function") {
      throw new Error("categoryTagRepository.update e obrigatorio.");
    }

    this.categoryTagRepository = categoryTagRepository;
    this.clock = clock;
  }

  async execute(id) {
    const existing = await this.categoryTagRepository.findById(id);
    if (!existing) {
      return { ok: false, errors: { id: "Etiqueta nao encontrada." } };
    }

    return {
      ok: true,
      value: await this.categoryTagRepository.update(id, {
        ...existing,
        isArchived: true,
        updatedAt: this.clock().toISOString(),
      }),
    };
  }
}
