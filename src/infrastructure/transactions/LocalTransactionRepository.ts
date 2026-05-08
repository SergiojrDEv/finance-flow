import { TransactionRepository } from "../../application/transactions/ports/TransactionRepository.js";
import type { TransactionEntity } from "../../application/shared/applicationTypes.js";

type SerializableTransaction = TransactionEntity & {
  toJSON?: () => TransactionEntity;
};

type LocalTransactionRepositoryDeps = {
  readTransactions?: () => TransactionEntity[];
  writeTransactions?: (transactions: TransactionEntity[]) => void;
  createId?: () => string;
};

function defaultCreateId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeTransaction(transaction: SerializableTransaction): TransactionEntity {
  return typeof transaction.toJSON === "function" ? transaction.toJSON() : { ...transaction };
}

export class LocalTransactionRepository extends TransactionRepository {
  private readonly readTransactions: () => TransactionEntity[];
  private readonly writeTransactions: (transactions: TransactionEntity[]) => void;
  private readonly createId: () => string;

  constructor({ readTransactions, writeTransactions, createId = defaultCreateId }: LocalTransactionRepositoryDeps = {}) {
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

  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const transactions = this.readTransactions();
    const saved = {
      ...serializeTransaction(transaction),
      id: transaction.id || this.createId(),
    };

    this.writeTransactions([...transactions, saved]);
    return saved;
  }

  async list(): Promise<TransactionEntity[]> {
    return [...this.readTransactions()];
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    return this.readTransactions().find((transaction) => transaction.id === id) || null;
  }

  async update(id: string, transaction: TransactionEntity): Promise<TransactionEntity | null> {
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

  async deleteById(id: string): Promise<TransactionEntity | null> {
    const transactions = this.readTransactions();
    const index = transactions.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const [removed] = transactions.slice(index, index + 1);
    this.writeTransactions(transactions.filter((item) => item.id !== id));
    return removed || null;
  }
}
