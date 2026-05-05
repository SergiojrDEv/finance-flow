function toAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildTransactionHighlights(transactions = []) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const paidCount = safeTransactions.filter((item) => item?.status === "paid").length;
  const pendingCount = safeTransactions.filter((item) => item?.status !== "paid").length;
  const pixCount = safeTransactions.filter((item) => item?.paymentMethod === "pix").length;
  const creditCount = safeTransactions.filter((item) => item?.paymentMethod === "credit").length;
  const totalIncome = safeTransactions
    .filter((item) => item?.type === "income")
    .reduce((sum, item) => sum + toAmount(item.amount), 0);
  const totalOutflow = safeTransactions
    .filter((item) => item?.type !== "income")
    .reduce((sum, item) => sum + toAmount(item.amount), 0);

  return {
    count: safeTransactions.length,
    status: {
      paid: paidCount,
      pending: pendingCount,
    },
    payments: {
      pix: pixCount,
      credit: creditCount,
    },
    totals: {
      income: roundMoney(totalIncome),
      outflow: roundMoney(totalOutflow),
    },
  };
}
