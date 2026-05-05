const COMMON_FIELDS = ["description", "category", "account", "amount", "date", "status"];
const EXPENSE_ONLY_FIELDS = ["subcategory", "paymentMethod", "dueDate", "recurrence", "repeatCount"];

export const TRANSACTION_TYPES = Object.freeze({
  income: "income",
  expense: "expense",
  investment: "investment",
});

export function getTransactionFormFields(type) {
  if (type === TRANSACTION_TYPES.expense) {
    return [...COMMON_FIELDS, ...EXPENSE_ONLY_FIELDS];
  }

  if (type === TRANSACTION_TYPES.income || type === TRANSACTION_TYPES.investment) {
    return [...COMMON_FIELDS];
  }

  return [];
}

export function shouldShowTransactionField(type, fieldName) {
  return getTransactionFormFields(type).includes(fieldName);
}

export function getHiddenTransactionFields(type) {
  const allFields = [...COMMON_FIELDS, ...EXPENSE_ONLY_FIELDS];
  const visible = new Set(getTransactionFormFields(type));
  return allFields.filter((field) => !visible.has(field));
}
