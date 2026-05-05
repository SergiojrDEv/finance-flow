import { CategoryTagRepository } from "../../src/application/catalog/ports/CategoryTagRepository.js";

export class InMemoryCategoryTagRepository extends CategoryTagRepository {
  constructor(initialTags = []) {
    super();
    this.tags = [...initialTags];
  }

  async save(tag) {
    const saved = {
      ...tag.toJSON(),
      id: tag.id || `tag-${this.tags.length + 1}`,
    };
    this.tags.push(saved);
    return saved;
  }

  async findByKindCategoryAndSlug(kind, categorySlug, slug) {
    return this.tags.find((tag) =>
      tag.kind === kind && tag.categorySlug === categorySlug && tag.slug === slug
    ) || null;
  }

  async findById(id) {
    return this.tags.find((tag) => tag.id === id) || null;
  }

  async update(id, tag) {
    const index = this.tags.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const saved = typeof tag.toJSON === "function" ? tag.toJSON() : { ...tag };
    saved.id = id;
    this.tags[index] = saved;
    return saved;
  }

  async list() {
    return [...this.tags];
  }
}
