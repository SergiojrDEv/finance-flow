export function mapV2Transaction(row, refs = {}, now = new Date().toISOString()) {
  const category = refs.categoryById?.get(row.category_id);
  const tag = refs.tagById?.get(row.category_tag_id);
  const account = refs.accountById?.get(row.account_id);

  return {
    id: row.id,
    type: row.transaction_kind,
    description: row.description || "",
    category: category?.slug || "outros",
    subcategory: tag?.slug || null,
    account: account?.name || "Conta corrente",
    amount: Number(row.amount || 0),
    date: row.transaction_date,
    dueDate: row.due_date || row.transaction_date,
    status: row.status || "paid",
    paymentMethod: row.payment_method || "pix",
    creditCardId: row.credit_card_id || null,
    recurrenceId: row.recurring_rule_id || null,
    installmentGroup: row.installment_group_id || null,
    installmentNumber: row.installment_number || null,
    installmentTotal: row.installment_total || null,
    createdAt: row.created_at || now,
  };
}

export function mapV2TransactionsWithLegacyFallback({ rows = [], legacyRows = [], refs = {}, now } = {}) {
  const legacyById = new Map(legacyRows.map((item) => [item.id, item]));

  return rows.map((row) => {
    const transaction = mapV2Transaction(row, refs, now);
    const legacy = legacyById.get(transaction.id);
    if (!legacy) return transaction;

    return {
      ...transaction,
      category: (transaction.category === "outros" || !transaction.category) && legacy.cat ? legacy.cat : transaction.category,
      subcategory: !transaction.subcategory && legacy.subcat ? legacy.subcat : transaction.subcategory,
      type: !transaction.type && legacy.type ? legacy.type : transaction.type,
    };
  });
}
