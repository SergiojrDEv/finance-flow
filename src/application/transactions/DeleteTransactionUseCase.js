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

    if (existing.userId && userId && existing.userId !== userId) {
      return {
        ok: false,
        errors: { userId: "Lancamento pertence a outro usuario." },
      };
    }

    const removed = await this.transactionRepository.deleteById(id);

    return {
      ok: true,
      value: removed,
    };
  }
}
