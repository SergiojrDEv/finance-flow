function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isSameMonth(transaction, currentDate) {
  const [year, month] = String(transaction.date || "").split("-").map(Number);
  return year === currentDate.getFullYear() && month === currentDate.getMonth() + 1;
}

function inferAccountTone(name = "") {
  const lower = String(name).toLowerCase();
  if (lower.includes("cartao") || lower.includes("credito")) return "credit";
  if (lower.includes("corretora") || lower.includes("invest")) return "investment";
  if (lower.includes("carteira")) return "wallet";
  return "checking";
}

function accountCaption(tone) {
  const captions = {
    credit: "Fatura e compras do mes",
    investment: "Aportes e metas vinculadas",
    wallet: "Dinheiro manual e saldos locais",
    checking: "Disponivel para movimentacao",
  };
  return captions[tone] || captions.checking;
}

function accountBalance({ accountName, tone, transactions, currentDate }) {
  const monthTransactions = transactions.filter((transaction) => isSameMonth(transaction, currentDate));
  if (tone === "credit") {
    return monthTransactions
      .filter((transaction) => transaction.type === "expense" && transaction.paymentMethod === "credit")
      .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  }
  if (tone === "investment") {
    return monthTransactions
      .filter((transaction) => transaction.type === "investment")
      .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  }
  return monthTransactions
    .filter((transaction) => transaction.account === accountName)
    .reduce((total, transaction) => {
      if (transaction.type === "income") return total + toNumber(transaction.amount);
      if (transaction.type === "expense" || transaction.type === "investment") return total - toNumber(transaction.amount);
      return total;
    }, 0);
}

export function buildWalletOverview({
  settings = {},
  transactions = [],
  currentDate = new Date(),
} = {}) {
  const monthTransactions = transactions.filter((transaction) => isSameMonth(transaction, currentDate));
  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const expenses = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const investments = monthTransactions
    .filter((transaction) => transaction.type === "investment")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const available = income - expenses - investments;

  const accountCards = (settings.accounts || []).map((accountName) => {
    const tone = inferAccountTone(accountName);
    return {
      name: accountName,
      tone,
      caption: accountCaption(tone),
      balance: accountBalance({ accountName, tone, transactions, currentDate }),
    };
  });

  const creditCardRows = (settings.creditCards || []).map((card) => {
    const amount = monthTransactions
      .filter((transaction) => transaction.type === "expense" && transaction.paymentMethod === "credit")
      .filter((transaction) => !transaction.creditCardId || transaction.creditCardId === card.id)
      .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
    return {
      name: card.name,
      caption: `Fecha dia ${card.closingDay || "-"} | vence dia ${card.dueDay || "-"}`,
      amount,
    };
  });

  return {
    patrimony: available + investments,
    available,
    investments,
    income,
    expenses,
    accountCards,
    creditCardRows,
    review: {
      imported: 0,
      matched: 0,
      manualAccounts: accountCards.length,
    },
  };
}
