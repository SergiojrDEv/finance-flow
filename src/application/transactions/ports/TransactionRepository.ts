export class TransactionRepository {
  async save(): Promise<unknown> {
    throw new Error("TransactionRepository.save precisa ser implementado.");
  }

  async findById(): Promise<unknown> {
    throw new Error("TransactionRepository.findById precisa ser implementado.");
  }

  async update(): Promise<unknown> {
    throw new Error("TransactionRepository.update precisa ser implementado.");
  }

  async deleteById(): Promise<unknown> {
    throw new Error("TransactionRepository.deleteById precisa ser implementado.");
  }
}
