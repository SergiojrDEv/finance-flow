export class CreateTransactionSeriesUseCase {
  constructor({ createTransaction } = {}) {
    if (!createTransaction || typeof createTransaction.execute !== "function") {
      throw new Error("createTransaction.execute e obrigatorio.");
    }

    this.createTransaction = createTransaction;
  }

  async execute(drafts = []) {
    if (!Array.isArray(drafts) || !drafts.length) {
      return {
        ok: false,
        errors: { transactions: "Nenhum lancamento informado." },
        values: [],
      };
    }

    const values = [];

    for (const draft of drafts) {
      const result = await this.createTransaction.execute(draft);

      if (!result.ok) {
        return {
          ok: false,
          errors: result.errors || { transactions: "Lancamento invalido." },
          values,
        };
      }

      values.push(result.value);
    }

    return {
      ok: true,
      value: values,
    };
  }
}
