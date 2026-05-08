import { Category } from "../../domain/catalog/Category.js";
import { fail, ok } from "../shared/result.js";

export class CreateCategoryUseCase {
  constructor({ categoryRepository, clock = () => new Date() } = {}) {
    if (!categoryRepository || typeof categoryRepository.save !== "function") {
      throw new Error("categoryRepository.save e obrigatorio.");
    }
    if (typeof categoryRepository.findByKindAndSlug !== "function") {
      throw new Error("categoryRepository.findByKindAndSlug e obrigatorio.");
    }

    this.categoryRepository = categoryRepository;
    this.clock = clock;
  }

  async execute(draft) {
    const existing = await this.categoryRepository.findByKindAndSlug(draft.kind, draft.slug);
    if (existing && !existing.isArchived) {
      return fail({ slug: "Categoria ja existe para este tipo." });
    }

    const now = this.clock().toISOString();
    const creation = Category.create({
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
    });

    if (!creation.ok) {
      return fail(creation.errors);
    }

    const saved = await this.categoryRepository.save(creation.value);

    return ok(saved);
  }
}
