export function mapAccountRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    kind: row.kind,
    color: row.color || "#0b7285",
    institution: row.institution || null,
    isArchived: Boolean(row.is_archived),
  };
}

export function mapCreditCardRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    accountId: row.account_id || null,
    name: row.name,
    brand: row.brand || null,
    color: row.color || "#635bff",
    closingDay: Number(row.closing_day || 25),
    dueDay: Number(row.due_day || 10),
    creditLimit: row.credit_limit == null ? null : Number(row.credit_limit),
    isArchived: Boolean(row.is_archived),
  };
}
