import { TransactionRepository } from "../../src/application/transactions/ports/TransactionRepository.js";

export class InMemoryTransactionRepository extends TransactionRepository {
  constructor(initialTransactions = []) {
    super();
    this.transactions = [...initialTransactions];
  }

  async save(transaction) {
    const saved = {
      ...transaction.toJSON(),
      id: transaction.id || `tx-${this.transactions.length + 1}`,
    };
    this.transactions.push(saved);
    return saved;
  }

  all() {
    return [...this.transactions];
  }

  async findById(id) {
    return this.transactions.find((transaction) => transaction.id === id) || null;
  }

  async update(id, transaction) {
    const index = this.transactions.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const saved = {
      ...transaction.toJSON(),
      id,
    };
    this.transactions[index] = saved;
    return saved;
  }

  async deleteById(id) {
    const index = this.transactions.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const [removed] = this.transactions.splice(index, 1);
    return removed;
  }
}
