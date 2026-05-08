import type { CategoryTagEntity, TransactionKind } from "../../shared/applicationTypes.js";

export class CategoryTagRepository {
  async save(_tag?: CategoryTagEntity): Promise<CategoryTagEntity> {
    throw new Error("CategoryTagRepository.save precisa ser implementado.");
  }

  async findByKindCategoryAndSlug(
    _kind?: TransactionKind | string,
    _categorySlug?: string,
    _slug?: string,
  ): Promise<CategoryTagEntity | null> {
    throw new Error("CategoryTagRepository.findByKindCategoryAndSlug precisa ser implementado.");
  }

  async findById(_id?: string): Promise<CategoryTagEntity | null> {
    throw new Error("CategoryTagRepository.findById precisa ser implementado.");
  }

  async update(_id?: string, _tag?: Partial<CategoryTagEntity>): Promise<CategoryTagEntity> {
    throw new Error("CategoryTagRepository.update precisa ser implementado.");
  }

  async list(): Promise<CategoryTagEntity[]> {
    throw new Error("CategoryTagRepository.list precisa ser implementado.");
  }
}
