import { CategoryTagRepository } from "../../application/catalog/ports/CategoryTagRepository.js";

function defaultCreateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeTag(tag) {
  return typeof tag.toJSON === "function" ? tag.toJSON() : { ...tag };
}

export class LocalCategoryTagRepository extends CategoryTagRepository {
  constructor({ readTags, writeTags, createId = defaultCreateId } = {}) {
    super();

    if (typeof readTags !== "function") {
      throw new Error("readTags e obrigatorio.");
    }

    if (typeof writeTags !== "function") {
      throw new Error("writeTags e obrigatorio.");
    }

    this.readTags = readTags;
    this.writeTags = writeTags;
    this.createId = createId;
  }

  async save(tag) {
    const tags = this.readTags();
    const saved = {
      ...serializeTag(tag),
      id: tag.id || this.createId(),
    };

    this.writeTags([...tags, saved]);
    return saved;
  }

  async findByKindCategoryAndSlug(kind, categorySlug, slug) {
    return this.readTags().find((tag) =>
      tag.kind === kind && tag.categorySlug === categorySlug && tag.slug === slug
    ) || null;
  }

  async findById(id) {
    return this.readTags().find((tag) => tag.id === id) || null;
  }

  async update(id, tag) {
    const tags = this.readTags();
    const index = tags.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const saved = {
      ...serializeTag(tag),
      id,
    };
    const nextTags = [...tags];
    nextTags[index] = saved;
    this.writeTags(nextTags);
    return saved;
  }

  async list() {
    return [...this.readTags()];
  }
}
