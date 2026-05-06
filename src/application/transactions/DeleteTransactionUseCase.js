import { fail, ok } from "../shared/result.js";

export class DeleteTransactionUseCase {
  constructor({ transactionRepository } = {}) {
    if (!transactionRepository || typeof transactionRepository.findById !== "function") {
      throw new Error("transactionRepository.findById e obrigatorio.");
    }
    if (typeof transactionRepository.deleteById !== "function") {
      throw new Error("transactionRepository.deleteById e obrigatorio.");
    }

    this.transactionRepository = transactionRepository;
  }

  async execute(id, { userId } = {}) {
    if (!id) {
      return fail({ id: "Lancamento e obrigatorio." });
    }

    const existing = await this.transactionRepository.findById(id);
    if (!existing) {
      return fail({ id: "Lancamento nao encontrado." });
    }

    if (existing.userId && userId && existing.userId !== userId) {
      return fail({ userId: "Lancamento pertence a outro usuario." });
    }

    const removed = await this.transactionRepository.deleteById(id);

    return ok(removed);
  }
}
