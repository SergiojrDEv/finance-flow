import { CategoryTag } from "../../domain/catalog/CategoryTag.js";

export class UpdateCategoryTagUseCase {
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

  async execute(id, draft) {
    const existing = await this.categoryTagRepository.findById(id);
    if (!existing) {
      return { ok: false, errors: { id: "Etiqueta nao encontrada." } };
    }

    const now = this.clock().toISOString();
    const creation = CategoryTag.create({
      ...existing,
      ...draft,
      id,
      kind: existing.kind,
      categorySlug: existing.categorySlug,
      slug: existing.slug,
      createdAt: existing.createdAt || draft.createdAt || now,
      updatedAt: now,
    });

    if (!creation.ok) return { ok: false, errors: creation.errors };

    return {
      ok: true,
      value: await this.categoryTagRepository.update(id, creation.value),
    };
  }
}
