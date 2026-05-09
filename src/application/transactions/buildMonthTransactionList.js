const VALID_TYPES = new Set(["income", "expense", "investment"]);

const TYPE_LABELS = {
  income: "Receita",
  expense: "Despesa",
  investment: "Investimento",
};

const STATUS_LABELS = {
  paid: "Pago",
  pending: "Pendente",
  planned: "Previsto",
};

const PAYMENT_METHOD_LABELS = {
  pix: "Pix",
  debit: "Debito",
  credit: "Credito",
  cash: "Dinheiro",
  transfer: "Transferencia",
};

function parseMonthKey(dateValue) {
  const [year, month] = String(dateValue || "").split("-");
  if (!year || !month) return "";
  return `${year}-${month}`;
}

export function normalizeTransactionType(type) {
  return VALID_TYPES.has(type) ? type : "expense";
}

export function getTransactionTypeLabel(type) {
  return TYPE_LABELS[normalizeTransactionType(type)] || TYPE_LABELS.expense;
}

export function getTransactionStatusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.paid;
}

export function getPaymentMethodLabel(paymentMethod) {
  return PAYMENT_METHOD_LABELS[paymentMethod] || "Outro";
}

export function getTransactionFlowLabel(type, paymentMethod) {
  const normalizedType = normalizeTransactionType(type);
  if (normalizedType === "income") return "Entrada";
  if (normalizedType === "investment") return "Aporte";
  return getPaymentMethodLabel(paymentMethod);
}

export function getTransactionAmountPresentation(type) {
  const normalizedType = normalizeTransactionType(type);
  return {
    sign: normalizedType === "income" ? "+" : "-",
    className: normalizedType === "income" ? "positive" : normalizedType === "investment" ? "purple" : "negative",
  };
}

export function buildMonthTransactionList({
  transactions = [],
  monthKey = "",
  typeFilter = "all",
  search = "",
} = {}) {
  const query = String(search || "").toLowerCase().trim();
  const safeTypeFilter = VALID_TYPES.has(typeFilter) ? typeFilter : "all";

  return (Array.isArray(transactions) ? transactions : [])
    .filter((item) => parseMonthKey(item?.date) === monthKey)
    .map((item) => ({
      ...item,
      type: normalizeTransactionType(item?.type || item?.transaction_kind || item?.kind),
      description: item?.description || "",
      category: item?.category || "",
      subcategory: item?.subcategory || "",
      account: item?.account || "",
      paymentMethod: item?.paymentMethod || "pix",
      date: item?.date || "",
      dueDate: item?.dueDate || "",
      status: item?.status || "paid",
      amount: Number(item?.amount || 0),
    }))
    .map((item) => ({
      ...item,
      presentation: {
        typeLabel: getTransactionTypeLabel(item.type),
        statusLabel: getTransactionStatusLabel(item.status),
        paymentMethodLabel: getPaymentMethodLabel(item.paymentMethod),
        flowLabel: getTransactionFlowLabel(item.type, item.paymentMethod),
        amount: getTransactionAmountPresentation(item.type),
      },
    }))
    .filter((item) => safeTypeFilter === "all" || item.type === safeTypeFilter)
    .filter((item) => {
      if (!query) return true;
      const haystack = `${item.description} ${item.category} ${item.subcategory} ${item.account} ${item.paymentMethod}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}
