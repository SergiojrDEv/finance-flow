import { CategoryRepository } from "../../src/application/catalog/ports/CategoryRepository.js";

export class InMemoryCategoryRepository extends CategoryRepository {
  constructor(initialCategories = []) {
    super();
    this.categories = [...initialCategories];
  }

  async save(category) {
    const saved = {
      ...category.toJSON(),
      id: category.id || `cat-${this.categories.length + 1}`,
    };
    this.categories.push(saved);
    return saved;
  }

  async findByKindAndSlug(kind, slug) {
    return this.categories.find((category) => category.kind === kind && category.slug === slug) || null;
  }

  async findById(id) {
    return this.categories.find((category) => category.id === id) || null;
  }

  async update(id, category) {
    const index = this.categories.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const saved = typeof category.toJSON === "function" ? category.toJSON() : { ...category };
    saved.id = id;
    this.categories[index] = saved;
    return saved;
  }

  async list() {
    return [...this.categories];
  }
}
