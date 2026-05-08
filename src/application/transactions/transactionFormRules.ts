const COMMON_FIELDS = ["description", "category", "account", "amount", "date", "status"] as const;
const EXPENSE_ONLY_FIELDS = ["subcategory", "paymentMethod", "dueDate", "recurrence", "repeatCount"] as const;

export const TRANSACTION_TYPES = Object.freeze({
  income: "income",
  expense: "expense",
  investment: "investment",
} as const);

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];
export type TransactionFormField = (typeof COMMON_FIELDS)[number] | (typeof EXPENSE_ONLY_FIELDS)[number];

export function getTransactionFormFields(type: string): TransactionFormField[] {
  if (type === TRANSACTION_TYPES.expense) {
    return [...COMMON_FIELDS, ...EXPENSE_ONLY_FIELDS];
  }

  if (type === TRANSACTION_TYPES.income || type === TRANSACTION_TYPES.investment) {
    return [...COMMON_FIELDS];
  }

  return [];
}

export function shouldShowTransactionField(type: string, fieldName: TransactionFormField): boolean {
  return getTransactionFormFields(type).includes(fieldName);
}

export function getHiddenTransactionFields(type: string): TransactionFormField[] {
  const allFields = [...COMMON_FIELDS, ...EXPENSE_ONLY_FIELDS];
  const visible = new Set(getTransactionFormFields(type));
  return allFields.filter((field) => !visible.has(field));
}
