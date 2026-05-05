import { Category } from "../../domain/catalog/Category.js";

export class UpdateCategoryUseCase {
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

  async execute(id, draft) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      return { ok: false, errors: { id: "Categoria nao encontrada." } };
    }

    const now = this.clock().toISOString();
    const creation = Category.create({
      ...existing,
      ...draft,
      id,
      kind: existing.kind,
      slug: existing.slug,
      createdAt: existing.createdAt || draft.createdAt || now,
      updatedAt: now,
    });

    if (!creation.ok) return { ok: false, errors: creation.errors };

    return {
      ok: true,
      value: await this.categoryRepository.update(id, creation.value),
    };
  }
}
