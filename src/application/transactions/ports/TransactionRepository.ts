import type { TransactionEntity } from "../../shared/applicationTypes.js";

export class TransactionRepository {
  async save(_transaction?: TransactionEntity): Promise<TransactionEntity> {
    throw new Error("TransactionRepository.save precisa ser implementado.");
  }

  async findById(_id?: string): Promise<TransactionEntity | null> {
    throw new Error("TransactionRepository.findById precisa ser implementado.");
  }

  async update(_id?: string, _transaction?: Partial<TransactionEntity>): Promise<TransactionEntity> {
    throw new Error("TransactionRepository.update precisa ser implementado.");
  }

  async deleteById(_id?: string): Promise<TransactionEntity | null> {
    throw new Error("TransactionRepository.deleteById precisa ser implementado.");
  }
}
