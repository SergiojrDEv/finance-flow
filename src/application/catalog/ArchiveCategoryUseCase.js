import { fail, ok } from "../shared/result.js";

export class ArchiveCategoryUseCase {
  constructor({ categoryRepository, clock = () => new Date() } = {}) {
    if (!categoryRepository || typeof categoryRepository.findById !== "function") {
      throw new Error("categoryRepository.findById e obrigatorio.");
    }
    if (typeof categoryRepository.update !== "function") {
      throw new Error("categoryRepository.update e obrigatorio.");
    }

    this.categoryRepository = categoryRepository;
    this.clock = clock;
  }

  async execute(id) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      return fail({ id: "Categoria nao encontrada." });
    }

    return ok(await this.categoryRepository.update(id, {
        ...existing,
        isArchived: true,
        updatedAt: this.clock().toISOString(),
      }));
  }
}
