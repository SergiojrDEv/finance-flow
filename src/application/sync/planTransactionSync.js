const VALID_TRANSACTION_KINDS = new Set(["income", "expense", "investment"]);

function normalizeTransactionKind(transaction) {
  const kind = transaction?.type || transaction?.transaction_kind || transaction?.kind;
  return VALID_TRANSACTION_KINDS.has(kind) ? kind : "expense";
}

export function mapTransactionToV2Row(transaction, { userId, categories, accounts, tagIds, now = new Date().toISOString() } = {}) {
  if (!transaction?.id) return null;

  const transactionKind = normalizeTransactionKind(transaction);
  const category = categories?.get(`${transactionKind}:${transaction.category}`);
  const categoryId = category?.id || null;
  const categoryTagId = categoryId && transaction.subcategory
    ? tagIds?.get(`${categoryId}:${transaction.subcategory}`) || null
    : null;

  return {
    id: transaction.id,
    user_id: userId,
    transaction_kind: transactionKind,
    status: transaction.status || "paid",
    description: transaction.description,
    amount: Number(transaction.amount),
    transaction_date: transaction.date,
    due_date: transaction.dueDate || transaction.date,
    category_id: categoryId,
    category_tag_id: categoryTagId,
    account_id: accounts?.get(String(transaction.account || "Conta corrente").toLowerCase()) || null,
    credit_card_id: transaction.creditCardId || null,
    payment_method: transaction.paymentMethod || "pix",
    recurring_rule_id: transaction.recurrenceId || null,
    installment_group_id: transaction.installmentGroup || null,
    installment_number: transaction.installmentNumber || null,
    installment_total: transaction.installmentTotal || null,
    created_at: transaction.createdAt || now,
    updated_at: now,
  };
}

export function planTransactionV2Sync({ localTransactions = [], remoteTransactions = [], refs = {} } = {}) {
  const upserts = localTransactions
    .map((transaction) => mapTransactionToV2Row(transaction, refs))
    .filter(Boolean);
  const localIds = new Set(upserts.map((item) => item.id));
  const deletes = remoteTransactions
    .map((item) => item?.id)
    .filter((id) => id && !localIds.has(id));

  return { upserts, deletes };
}
