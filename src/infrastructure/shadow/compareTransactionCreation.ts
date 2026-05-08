import type { TransactionDraft } from "../../application/shared/applicationTypes.js";

const DEFAULT_FIELDS = [
  "type",
  "description",
  "category",
  "subcategory",
  "account",
  "amount",
  "date",
  "dueDate",
  "status",
  "paymentMethod",
  "recurrence",
];

type ComparableTransaction = Record<string, unknown>;
type CreateTransactionUseCaseLike = {
  execute: (draft?: TransactionDraft) => Promise<{ ok: boolean; value?: ComparableTransaction; errors?: Record<string, string> }>;
};

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === "") return null;
  if (typeof value === "number") return Math.round((value + Number.EPSILON) * 100) / 100;
  return value;
}

function pickComparable(transaction: ComparableTransaction | undefined, fields: string[]): ComparableTransaction {
  return fields.reduce<ComparableTransaction>((acc, field) => {
    acc[field] = normalizeValue(transaction?.[field]);
    return acc;
  }, {});
}

function diffComparable(legacy: ComparableTransaction, modern: ComparableTransaction): Record<string, { legacy: unknown; modern: unknown }> {
  return Object.keys(legacy).reduce<Record<string, { legacy: unknown; modern: unknown }>>((diffs, field) => {
    if (legacy[field] !== modern[field]) {
      diffs[field] = {
        legacy: legacy[field],
        modern: modern[field],
      };
    }
    return diffs;
  }, {});
}

export async function compareTransactionCreation({
  draft,
  legacyTransaction,
  createTransaction,
  fields = DEFAULT_FIELDS,
}: {
  draft?: TransactionDraft;
  legacyTransaction?: ComparableTransaction;
  createTransaction?: CreateTransactionUseCaseLike;
  fields?: string[];
} = {}) {
  if (!createTransaction || typeof createTransaction.execute !== "function") {
    throw new Error("createTransaction.execute e obrigatorio.");
  }

  const modernResult = await createTransaction.execute(draft);

  if (!modernResult.ok) {
    return {
      ok: false,
      matched: false,
      errors: modernResult.errors,
      diffs: {},
    };
  }

  const legacyComparable = pickComparable(legacyTransaction, fields);
  const modernComparable = pickComparable(modernResult.value, fields);
  const diffs = diffComparable(legacyComparable, modernComparable);

  return {
    ok: true,
    matched: Object.keys(diffs).length === 0,
    legacy: legacyComparable,
    modern: modernComparable,
    diffs,
  };
}
