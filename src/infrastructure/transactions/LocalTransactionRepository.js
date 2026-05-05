import { TransactionRepository } from "../../application/transactions/ports/TransactionRepository.js";

function defaultCreateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeTransaction(transaction) {
  return typeof transaction.toJSON === "function" ? transaction.toJSON() : { ...transaction };
}

export class LocalTransactionRepository extends TransactionRepository {
  constructor({ readTransactions, writeTransactions, createId = defaultCreateId } = {}) {
    super();

    if (typeof readTransactions !== "function") {
      throw new Error("readTransactions e obrigatorio.");
    }

    if (typeof writeTransactions !== "function") {
      throw new Error("writeTransactions e obrigatorio.");
    }

    this.readTransactions = readTransactions;
    this.writeTransactions = writeTransactions;
    this.createId = createId;
  }

  async save(transaction) {
    const transactions = this.readTransactions();
    const saved = {
      ...serializeTransaction(transaction),
      id: transaction.id || this.createId(),
    };

    this.writeTransactions([...transactions, saved]);
    return saved;
  }

  async list() {
    return [...this.readTransactions()];
  }

  async findById(id) {
    return this.readTransactions().find((transaction) => transaction.id === id) || null;
  }

  async update(id, transaction) {
    const transactions = this.readTransactions();
    const index = transactions.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const saved = {
      ...serializeTransaction(transaction),
      id,
    };
    const nextTransactions = [...transactions];
    nextTransactions[index] = saved;
    this.writeTransactions(nextTransactions);
    return saved;
  }

  async deleteById(id) {
    const transactions = this.readTransactions();
    const index = transactions.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const [removed] = transactions.slice(index, index + 1);
    this.writeTransactions(transactions.filter((item) => item.id !== id));
    return removed;
  }
}
