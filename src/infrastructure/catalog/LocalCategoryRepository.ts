import { CategoryRepository } from "../../application/catalog/ports/CategoryRepository.js";
import type { CategoryEntity, TransactionKind } from "../../application/shared/applicationTypes.js";

type SerializableCategory = CategoryEntity & {
  toJSON?: () => CategoryEntity;
};

type LocalCategoryRepositoryDeps = {
  readCategories?: () => CategoryEntity[];
  writeCategories?: (categories: CategoryEntity[]) => void;
  createId?: () => string;
};

function defaultCreateId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeCategory(category: SerializableCategory): CategoryEntity {
  return typeof category.toJSON === "function" ? category.toJSON() : { ...category };
}

export class LocalCategoryRepository extends CategoryRepository {
  private readonly readCategories: () => CategoryEntity[];
  private readonly writeCategories: (categories: CategoryEntity[]) => void;
  private readonly createId: () => string;

  constructor({ readCategories, writeCategories, createId = defaultCreateId }: LocalCategoryRepositoryDeps = {}) {
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

  async save(category: CategoryEntity): Promise<CategoryEntity> {
    const categories = this.readCategories();
    const saved = {
      ...serializeCategory(category),
      id: category.id || this.createId(),
    };

    this.writeCategories([...categories, saved]);
    return saved;
  }

  async findByKindAndSlug(kind: TransactionKind | string, slug: string): Promise<CategoryEntity | null> {
    return this.readCategories().find((category) => category.kind === kind && category.slug === slug) || null;
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    return this.readCategories().find((category) => category.id === id) || null;
  }

  async update(id: string, category: CategoryEntity): Promise<CategoryEntity | null> {
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

  async list(): Promise<CategoryEntity[]> {
    return [...this.readCategories()];
  }
}
