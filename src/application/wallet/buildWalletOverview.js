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
  openFinance = {},
  currentDate = new Date(),
} = {}) {
  const connections = openFinance.connections || [];
  const importedTransactions = openFinance.importedTransactions || [];
  const monthTransactions = transactions.filter((transaction) => isSameMonth(transaction, currentDate));
  const pendingImported = importedTransactions.filter((transaction) => transaction.status === "pending_review");
  const matchedImported = importedTransactions.filter((transaction) => transaction.status === "matched");
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

  const importedIncome = importedTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const importedExpenses = importedTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const importedInvestments = importedTransactions
    .filter((transaction) => transaction.type === "investment")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const importedAvailable = importedIncome - importedExpenses - importedInvestments;
  const hasOpenFinance = connections.length > 0;
  const patrimony = hasOpenFinance ? importedAvailable + importedInvestments : available + investments;
  const creditCardInUse = hasOpenFinance ? importedExpenses : creditCardRows.reduce((total, card) => total + card.amount, 0);

  const institutionRows = connections.map((connection) => ({
    id: connection.id,
    institutionId: connection.institutionId,
    name: connection.institutionName,
    status: connection.status || "connected",
    lastSyncAt: connection.lastSyncAt,
    balance: patrimony,
    accountBalance: Math.max(0, patrimony + creditCardInUse),
    creditBalance: creditCardInUse,
  }));

  return {
    hasOpenFinance,
    patrimony,
    available,
    investments,
    income,
    expenses,
    creditCardInUse,
    accountCards,
    creditCardRows,
    institutionRows,
    pendingImported,
    review: {
      imported: pendingImported.length,
      matched: matchedImported.length,
      manualAccounts: accountCards.length,
    },
  };
}
