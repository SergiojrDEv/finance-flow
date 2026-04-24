function assertValidInput(input) {
  if (!input.description?.trim()) throw new Error("description is required");
  if (!(input.amount > 0)) throw new Error("amount must be greater than zero");
  if (!input.transactionDate) throw new Error("transactionDate is required");
}

export function createTransaction(input, idFactory, nowIso) {
  assertValidInput(input);

  return {
    id: idFactory(),
    type: input.kind,
    description: input.description.trim(),
    category: input.category || "",
    subcategory: input.subcategory || null,
    account: input.account || "",
    amount: input.amount,
    date: input.transactionDate,
    dueDate: input.dueDate || input.transactionDate,
    status: input.status || "paid",
    paymentMethod: input.paymentMethod || "pix",
    creditCardId: input.creditCardId || null,
    recurrence: input.recurrence || "none",
    recurrenceId: input.recurrenceId || null,
    installmentGroup: input.installmentGroup || null,
    installmentNumber: input.installmentNumber || null,
    installmentTotal: input.installmentTotal || null,
    createdAt: nowIso,
  };
}
