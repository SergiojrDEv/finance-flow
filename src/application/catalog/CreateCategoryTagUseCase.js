import { CategoryTag } from "../../domain/catalog/CategoryTag.js";

export class CreateCategoryTagUseCase {
  constructor({ categoryRepository, categoryTagRepository, clock = () => new Date() } = {}) {
    if (!categoryRepository || typeof categoryRepository.findByKindAndSlug !== "function") {
      throw new Error("categoryRepository.findByKindAndSlug e obrigatorio.");
    }
    if (!categoryTagRepository || typeof categoryTagRepository.save !== "function") {
      throw new Error("categoryTagRepository.save e obrigatorio.");
    }
    if (typeof categoryTagRepository.findByKindCategoryAndSlug !== "function") {
      throw new Error("categoryTagRepository.findByKindCategoryAndSlug e obrigatorio.");
    }

    this.categoryRepository = categoryRepository;
    this.categoryTagRepository = categoryTagRepository;
    this.clock = clock;
  }

  async execute(draft) {
    const category = await this.categoryRepository.findByKindAndSlug(draft.kind, draft.categorySlug);
    if (!category || category.isArchived) {
      return {
        ok: false,
        errors: { categorySlug: "Categoria principal nao encontrada." },
      };
    }

    const existing = await this.categoryTagRepository.findByKindCategoryAndSlug(draft.kind, draft.categorySlug, draft.slug);
    if (existing && !existing.isArchived) {
      return {
        ok: false,
        errors: { slug: "Etiqueta ja existe nesta categoria." },
      };
    }

    const now = this.clock().toISOString();
    const creation = CategoryTag.create({
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
    });

    if (!creation.ok) {
      return {
        ok: false,
        errors: creation.errors,
      };
    }

    const saved = await this.categoryTagRepository.save(creation.value);

    return {
      ok: true,
      value: saved,
    };
  }
}
