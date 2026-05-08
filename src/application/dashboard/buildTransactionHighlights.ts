interface TransactionHighlightItem {
  type?: string;
  amount?: number | string | null;
  status?: string;
  paymentMethod?: string;
}

interface TransactionHighlights {
  count: number;
  status: {
    paid: number;
    pending: number;
  };
  payments: {
    pix: number;
    credit: number;
  };
  totals: {
    income: number;
    outflow: number;
  };
}

function toAmount(value: TransactionHighlightItem["amount"]): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildTransactionHighlights(transactions: TransactionHighlightItem[] = []): TransactionHighlights {
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
