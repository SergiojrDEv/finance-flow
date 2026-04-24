export function updateTransaction(current, patch) {
  const next = {
    ...current,
    ...patch,
    description: (patch.description ?? current.description).trim(),
    dueDate: patch.dueDate ?? current.dueDate ?? current.date,
  };

  if (!next.description) throw new Error("description is required");
  if (!(next.amount > 0)) throw new Error("amount must be greater than zero");
  if (!next.date) throw new Error("transactionDate is required");

  return next;
}
