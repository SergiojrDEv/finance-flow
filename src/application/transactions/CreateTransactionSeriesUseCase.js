import { fail, ok } from "../shared/result.js";

export class CreateTransactionSeriesUseCase {
  constructor({ createTransaction } = {}) {
    if (!createTransaction || typeof createTransaction.execute !== "function") {
      throw new Error("createTransaction.execute e obrigatorio.");
    }

    this.createTransaction = createTransaction;
  }

  async execute(drafts = []) {
    if (!Array.isArray(drafts) || !drafts.length) {
      return fail({ transactions: "Nenhum lancamento informado." }, { values: [] });
    }

    const values = [];

    for (const draft of drafts) {
      const result = await this.createTransaction.execute(draft);

      if (!result.ok) {
        return fail(result.errors || { transactions: "Lancamento invalido." }, { values });
      }

      values.push(result.value);
    }

    return ok(values);
  }
}
