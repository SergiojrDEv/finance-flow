import { CategoryTagRepository } from "../../application/catalog/ports/CategoryTagRepository.js";
import type { CategoryTagEntity, TransactionKind } from "../../application/shared/applicationTypes.js";

type SerializableCategoryTag = CategoryTagEntity & {
  toJSON?: () => CategoryTagEntity;
};

type LocalCategoryTagRepositoryDeps = {
  readTags?: () => CategoryTagEntity[];
  writeTags?: (tags: CategoryTagEntity[]) => void;
  createId?: () => string;
};

function defaultCreateId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeTag(tag: SerializableCategoryTag): CategoryTagEntity {
  return typeof tag.toJSON === "function" ? tag.toJSON() : { ...tag };
}

export class LocalCategoryTagRepository extends CategoryTagRepository {
  private readonly readTags: () => CategoryTagEntity[];
  private readonly writeTags: (tags: CategoryTagEntity[]) => void;
  private readonly createId: () => string;

  constructor({ readTags, writeTags, createId = defaultCreateId }: LocalCategoryTagRepositoryDeps = {}) {
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

  async save(tag: CategoryTagEntity): Promise<CategoryTagEntity> {
    const tags = this.readTags();
    const saved = {
      ...serializeTag(tag),
      id: tag.id || this.createId(),
    };

    this.writeTags([...tags, saved]);
    return saved;
  }

  async findByKindCategoryAndSlug(
    kind: TransactionKind | string,
    categorySlug: string,
    slug: string,
  ): Promise<CategoryTagEntity | null> {
    return this.readTags().find((tag) =>
      tag.kind === kind && tag.categorySlug === categorySlug && tag.slug === slug
    ) || null;
  }

  async findById(id: string): Promise<CategoryTagEntity | null> {
    return this.readTags().find((tag) => tag.id === id) || null;
  }

  async update(id: string, tag: CategoryTagEntity): Promise<CategoryTagEntity | null> {
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

  async list(): Promise<CategoryTagEntity[]> {
    return [...this.readTags()];
  }
}
