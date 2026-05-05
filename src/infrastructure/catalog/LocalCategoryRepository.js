import { CategoryRepository } from "../../application/catalog/ports/CategoryRepository.js";

function defaultCreateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeCategory(category) {
  return typeof category.toJSON === "function" ? category.toJSON() : { ...category };
}

export class LocalCategoryRepository extends CategoryRepository {
  constructor({ readCategories, writeCategories, createId = defaultCreateId } = {}) {
    super();

    if (typeof readCategories !== "function") {
      throw new Error("readCategories e obrigatorio.");
    }

    if (typeof writeCategories !== "function") {
      throw new Error("writeCategories e obrigatorio.");
    }

    this.readCategories = readCategories;
    this.writeCategories = writeCategories;
    this.createId = createId;
  }

  async save(category) {
    const categories = this.readCategories();
    const saved = {
      ...serializeCategory(category),
      id: category.id || this.createId(),
    };

    this.writeCategories([...categories, saved]);
    return saved;
  }

  async findByKindAndSlug(kind, slug) {
    return this.readCategories().find((category) => category.kind === kind && category.slug === slug) || null;
  }

  async findById(id) {
    return this.readCategories().find((category) => category.id === id) || null;
  }

  async update(id, category) {
    const categories = this.readCategories();
    const index = categories.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const saved = {
      ...serializeCategory(category),
      id,
    };
    const nextCategories = [...categories];
    nextCategories[index] = saved;
    this.writeCategories(nextCategories);
    return saved;
  }

  async list() {
    return [...this.readCategories()];
  }
}
