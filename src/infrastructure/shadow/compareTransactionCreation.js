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

function normalizeValue(value) {
  if (value === undefined) return null;
  if (value === "") return null;
  if (typeof value === "number") return Math.round((value + Number.EPSILON) * 100) / 100;
  return value;
}

function pickComparable(transaction, fields) {
  return fields.reduce((acc, field) => {
    acc[field] = normalizeValue(transaction?.[field]);
    return acc;
  }, {});
}

function diffComparable(legacy, modern) {
  return Object.keys(legacy).reduce((diffs, field) => {
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
