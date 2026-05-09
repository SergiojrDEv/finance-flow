import { ImportedTransactionRepository } from "../../application/openfinance/ports/ImportedTransactionRepository.js";

function serializeImportedTransaction(transaction) {
  return typeof transaction.toJSON === "function" ? transaction.toJSON() : { ...transaction };
}

export class LocalImportedTransactionRepository extends ImportedTransactionRepository {
  constructor({ readImportedTransactions, writeImportedTransactions, createId = () => crypto.randomUUID() } = {}) {
    super();

    if (typeof readImportedTransactions !== "function") throw new Error("readImportedTransactions e obrigatorio.");
    if (typeof writeImportedTransactions !== "function") throw new Error("writeImportedTransactions e obrigatorio.");

    this.readImportedTransactions = readImportedTransactions;
    this.writeImportedTransactions = writeImportedTransactions;
    this.createId = createId;
  }

  async saveMany(importedTransactions) {
    const current = this.readImportedTransactions();
    const next = [...current];
    const saved = importedTransactions.map((transaction) => {
      const row = {
        ...serializeImportedTransaction(transaction),
        id: transaction.id || this.createId(transaction),
      };
      const existingIndex = next.findIndex((item) => item.connectionId === row.connectionId && item.externalId === row.externalId);
      if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], ...row };
      else next.push(row);
      return row;
    });
    this.writeImportedTransactions(next);
    return saved;
  }

  async listPendingByConnection(connectionId) {
    return this.readImportedTransactions()
      .filter((transaction) => transaction.connectionId === connectionId && transaction.status === "pending_review");
  }

  async findById(id) {
    return this.readImportedTransactions().find((transaction) => transaction.id === id) || null;
  }

  async markReviewed(id, patch) {
    const rows = this.readImportedTransactions();
    const index = rows.findIndex((transaction) => transaction.id === id);
    if (index < 0) return null;

    const next = [...rows];
    next[index] = {
      ...next[index],
      ...patch,
      status: patch.matchedTransactionId ? "matched" : "reviewed",
    };
    this.writeImportedTransactions(next);
    return next[index];
  }

  async deleteByConnection(connectionId) {
    const before = this.readImportedTransactions();
    const next = before.filter((transaction) => transaction.connectionId !== connectionId);
    this.writeImportedTransactions(next);
    return before.length - next.length;
  }
}
