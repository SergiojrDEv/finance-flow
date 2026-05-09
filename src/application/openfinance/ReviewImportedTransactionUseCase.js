import { fail, ok } from "../shared/result.js";

export class ReviewImportedTransactionUseCase {
  constructor({ importedTransactionRepository, clock = () => new Date() } = {}) {
    if (!importedTransactionRepository || typeof importedTransactionRepository.markReviewed !== "function") {
      throw new Error("importedTransactionRepository.markReviewed e obrigatorio.");
    }

    this.importedTransactionRepository = importedTransactionRepository;
    this.clock = clock;
  }

  async execute(importedTransactionId, { matchedTransactionId = null } = {}) {
    const reviewed = await this.importedTransactionRepository.markReviewed(importedTransactionId, {
      matchedTransactionId,
      reviewedAt: this.clock().toISOString(),
    });

    if (!reviewed) return fail({ importedTransaction: "Transacao importada nao encontrada." });

    return ok(reviewed);
  }
}
