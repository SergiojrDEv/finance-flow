import { Transaction } from "../../domain/transactions/Transaction.js";
import { fail, ok } from "../shared/result.js";

export class CreateTransactionUseCase {
  constructor({ transactionRepository, clock = () => new Date() } = {}) {
    if (!transactionRepository || typeof transactionRepository.save !== "function") {
      throw new Error("transactionRepository.save e obrigatorio.");
    }

    this.transactionRepository = transactionRepository;
    this.clock = clock;
  }

  async execute(draft) {
    const now = this.clock().toISOString();
    const creation = Transaction.create({
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: draft.updatedAt || now,
    });

    if (!creation.ok) {
      return fail(creation.errors);
    }

    const saved = await this.transactionRepository.save(creation.value);

    return ok(saved);
  }
}
