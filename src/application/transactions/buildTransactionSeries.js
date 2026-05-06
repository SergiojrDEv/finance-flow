const EXPENSE_ONLY_TYPE = "expense";

function parseLocalDate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMonths(dateValue, amount) {
  const date = parseLocalDate(dateValue);
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return toDateInput(next);
}

function shouldUseExpenseFields(type) {
  return type === EXPENSE_ONLY_TYPE;
}

function defaultPaymentMethodForType(type) {
  if (type === "income") return "transfer";
  if (type === "investment") return "transfer";
  return "pix";
}

function toPositiveInteger(value, fallback = 1) {
  return Math.max(1, Number(value || fallback) || fallback);
}

export function buildTransactionSeries({
  values = {},
  type = "expense",
  createId,
  now = new Date().toISOString(),
  resolveAccount = (value) => value,
} = {}) {
  if (typeof createId !== "function") {
    throw new Error("createId e obrigatorio.");
  }

  const useExpenseFields = shouldUseExpenseFields(type);
  const paymentMethod = values.paymentMethod || "pix";
  const normalizedPaymentMethod = useExpenseFields ? paymentMethod : defaultPaymentMethodForType(type);
  const isCredit = useExpenseFields && normalizedPaymentMethod === "credit";
  const installments = isCredit ? toPositiveInteger(values.installments) : 1;
  const repeatCount = useExpenseFields ? toPositiveInteger(values.repeatCount) : 1;
  const recurrence = useExpenseFields ? values.recurrence || "none" : "none";
  const totalItems = installments > 1 ? installments : recurrence === "monthly" ? repeatCount : 1;
  const groupId = totalItems > 1 ? createId() : null;
  const baseAmount = Number(values.amount);
  const perItemAmount = installments > 1 ? Number((baseAmount / installments).toFixed(2)) : baseAmount;
  const subcategory = useExpenseFields ? values.subcategory || null : null;
  const baseDescription = String(values.description || "").trim();

  return Array.from({ length: totalItems }, (_, index) => {
    const date = addMonths(values.date, index);
    const dueDate = values.dueDate ? addMonths(values.dueDate, index) : date;
    const suffix = installments > 1 ? ` (${index + 1}/${installments})` : recurrence === "monthly" && totalItems > 1 ? ` (${index + 1}/${totalItems})` : "";

    return {
      id: createId(),
      type,
      description: `${baseDescription}${suffix}`,
      category: values.category,
      subcategory,
      account: resolveAccount(values.account),
      amount: perItemAmount,
      date,
      dueDate,
      status: values.status || "paid",
      paymentMethod: normalizedPaymentMethod,
      creditCardId: isCredit ? values.creditCardId || null : null,
      recurrence,
      recurrenceId: recurrence === "monthly" ? groupId : null,
      installmentGroup: installments > 1 ? groupId : null,
      installmentNumber: installments > 1 ? index + 1 : null,
      installmentTotal: installments > 1 ? installments : null,
      createdAt: now,
    };
  });
}
