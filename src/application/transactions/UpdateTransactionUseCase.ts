import { Transaction } from "../../domain/transactions/Transaction.js";
import { fail, ok } from "../shared/result.js";

const EXPENSE_ONLY_FIELDS = [
  "subcategory",
  "paymentMethod",
  "creditCardId",
  "dueDate",
  "recurrence",
  "recurrenceId",
  "installmentGroup",
  "installmentNumber",
  "installmentTotal",
  "repeatCount",
];

function clearExpenseOnlyFieldsWhenNeeded(draft) {
  if (draft.type === "expense") return draft;
  const sanitized = { ...draft };
  EXPENSE_ONLY_FIELDS.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
}

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
      return fail({ id: "Lancamento e obrigatorio." });
    }

    const existing = await this.transactionRepository.findById(id);
    if (!existing) {
      return fail({ id: "Lancamento nao encontrado." });
    }

    if (existing.userId && draft.userId && existing.userId !== draft.userId) {
      return fail({ userId: "Lancamento pertence a outro usuario." });
    }

    const now = this.clock().toISOString();
    const existingForMerge = clearExpenseOnlyFieldsWhenNeeded({
      ...existing,
      type: draft.type || existing.type,
    });
    const mergedDraft = {
      ...existingForMerge,
      ...draft,
      id,
      userId: existing.userId || draft.userId,
      createdAt: existing.createdAt || draft.createdAt || now,
      updatedAt: now,
    };
    const creation = Transaction.create(mergedDraft);

    if (!creation.ok) {
      return fail(creation.errors);
    }

    const saved = await this.transactionRepository.update(id, creation.value);

    return ok(saved);
  }
}
