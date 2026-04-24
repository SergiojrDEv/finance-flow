import { mapTransactionToV2Row } from "../mappers/transactionMapper.js";

export function createV2TransactionWriteAdapter() {
  function fromLegacyTransactions({ userId, transactions, refs, nowIso }) {
    return transactions.map((item) => {
      const category = refs.categories.get(`${item.type}:${item.category}`);
      const categoryId = category?.id || null;
      const categoryTagId = categoryId && item.subcategory ? refs.tags.get(`${categoryId}:${item.subcategory}`) || null : null;

      return mapTransactionToV2Row({
        id: item.id,
        userId,
        kind: item.type,
        status: item.status || "paid",
        description: item.description,
        notes: null,
        amount: Number(item.amount),
        transactionDate: item.date,
        dueDate: item.dueDate || item.date,
        paidAt: item.status === "paid" ? (item.createdAt || nowIso) : null,
        categoryId,
        categoryTagId,
        accountId: refs.accounts.get(String(item.account || "Conta corrente").toLowerCase()) || null,
        creditCardId: item.creditCardId || null,
        paymentMethod: item.paymentMethod || "pix",
        recurringRuleId: item.recurrenceId || null,
        installmentGroupId: item.installmentGroup || null,
        installmentNumber: item.installmentNumber || null,
        installmentTotal: item.installmentTotal || null,
        createdAt: item.createdAt || nowIso,
        updatedAt: nowIso,
      });
    });
  }

  return {
    fromLegacyTransactions,
  };
}
