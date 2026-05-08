import type { CategoryEntity, TransactionKind } from "../../shared/applicationTypes.js";

export class CategoryRepository {
  async save(_category?: CategoryEntity): Promise<CategoryEntity> {
    throw new Error("CategoryRepository.save precisa ser implementado.");
  }

  async findByKindAndSlug(_kind?: TransactionKind | string, _slug?: string): Promise<CategoryEntity | null> {
    throw new Error("CategoryRepository.findByKindAndSlug precisa ser implementado.");
  }

  async findById(_id?: string): Promise<CategoryEntity | null> {
    throw new Error("CategoryRepository.findById precisa ser implementado.");
  }

  async update(_id?: string, _category?: Partial<CategoryEntity>): Promise<CategoryEntity> {
    throw new Error("CategoryRepository.update precisa ser implementado.");
  }

  async list(): Promise<CategoryEntity[]> {
    throw new Error("CategoryRepository.list precisa ser implementado.");
  }
}
