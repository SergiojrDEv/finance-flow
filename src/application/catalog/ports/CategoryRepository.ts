export class CategoryRepository {
  async save(): Promise<unknown> {
    throw new Error("CategoryRepository.save precisa ser implementado.");
  }

  async findByKindAndSlug(): Promise<unknown> {
    throw new Error("CategoryRepository.findByKindAndSlug precisa ser implementado.");
  }

  async findById(): Promise<unknown> {
    throw new Error("CategoryRepository.findById precisa ser implementado.");
  }

  async update(): Promise<unknown> {
    throw new Error("CategoryRepository.update precisa ser implementado.");
  }

  async list(): Promise<unknown> {
    throw new Error("CategoryRepository.list precisa ser implementado.");
  }
}
