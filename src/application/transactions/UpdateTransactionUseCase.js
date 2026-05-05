import { Transaction } from "../../domain/transactions/Transaction.js";

export class UpdateTransactionUseCase {
  constructor({ transactionRepository, clock = () => new Date() } = {}) {
    if (!transactionRepository || typeof transactionRepository.findById !== "function") {
      throw new Error("transactionRepository.findById e obrigatorio.");
    }
    if (typeof transactionRepository.update !== "function") {
      throw new Error("transactionRepository.update e obrigatorio.");
    }

    this.transactionRepository = transactionRepository;
    this.clock = clock;
  }

  async execute(id, draft) {
    if (!id) {
      return {
        ok: false,
        errors: { id: "Lancamento e obrigatorio." },
      };
    }

    const existing = await this.transactionRepository.findById(id);
    if (!existing) {
      return {
        ok: false,
        errors: { id: "Lancamento nao encontrado." },
      };
    }

    if (existing.userId && draft.userId && existing.userId !== draft.userId) {
      return {
        ok: false,
        errors: { userId: "Lancamento pertence a outro usuario." },
      };
    }

    const now = this.clock().toISOString();
    const creation = Transaction.create({
      ...existing,
      ...draft,
      id,
      userId: existing.userId || draft.userId,
      createdAt: existing.createdAt || draft.createdAt || now,
      updatedAt: now,
    });

    if (!creation.ok) {
      return {
        ok: false,
        errors: creation.errors,
      };
    }

    const saved = await this.transactionRepository.update(id, creation.value);

    return {
      ok: true,
      value: saved,
    };
  }
}
