export function normalizeRemoteDate(value, year, month, { now = () => new Date() } = {}) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  if (typeof value === "string" && value.includes("/")) {
    const [day, localMonth, localYear] = value.split("/");
    return `${localYear}-${localMonth.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (Number.isInteger(year) && Number.isInteger(month)) {
    return `${year}-${String(month + 1).padStart(2, "0")}-01`;
  }
  return now().toISOString().slice(0, 10);
}

export function mapLocalTransactionToLegacyRow(item, { userId, parseLocalDate, now = () => new Date() } = {}) {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!parseLocalDate || typeof parseLocalDate !== "function") {
    throw new Error("parseLocalDate e obrigatorio.");
  }

  const date = parseLocalDate(item.date);
  return {
    id: item.id,
    user_id: userId,
    date: item.date,
    descricao: item.description,
    cat: item.category,
    subcat: item.subcategory || null,
    type: item.type,
    val: Number(item.amount),
    account: item.account || "Conta corrente",
    status: item.status || "paid",
    due_date: item.dueDate || item.date,
    payment_method: item.paymentMethod || "pix",
    credit_card_id: item.creditCardId || null,
    recurrence_id: item.recurrenceId || null,
    installment_group: item.installmentGroup || null,
    installment_number: item.installmentNumber || null,
    installment_total: item.installmentTotal || null,
    year: date.getFullYear(),
    month: date.getMonth(),
    created_at: item.createdAt || now().toISOString(),
  };
}

export function mapLegacyRowToLocalTransaction(row, options = {}) {
  return {
    id: row.id,
    type: row.type,
    description: row.description || row.descricao || "",
    category: row.category || row.cat || "outros",
    subcategory: row.subcategory || row.subcat || null,
    account: row.account || "Conta corrente",
    amount: Number(row.amount ?? row.val ?? 0),
    date: normalizeRemoteDate(row.date, row.year, row.month, options),
    dueDate: normalizeRemoteDate(row.due_date || row.date, row.year, row.month, options),
    status: row.status || "paid",
    paymentMethod: row.payment_method || "pix",
    creditCardId: row.credit_card_id || null,
    recurrenceId: row.recurrence_id || null,
    installmentGroup: row.installment_group || null,
    installmentNumber: row.installment_number || null,
    installmentTotal: row.installment_total || null,
    createdAt: row.created_at || options.now?.().toISOString() || new Date().toISOString(),
  };
}
