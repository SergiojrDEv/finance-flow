import type { AmountPresentation, PaymentMethod, TransactionDraft, TransactionKind, TransactionStatus } from "../shared/applicationTypes.js";

type TransactionListItem = TransactionDraft & {
  type?: unknown;
  transaction_kind?: unknown;
  kind?: unknown;
  paymentMethod?: unknown;
  origin?: unknown;
  source?: unknown;
  importedTransactionId?: unknown;
};

type BuildMonthTransactionListInput = {
  transactions?: TransactionListItem[];
  monthKey?: string;
  typeFilter?: string;
  search?: string;
};

const VALID_TYPES = new Set<TransactionKind>(["income", "expense", "investment"]);

const TYPE_LABELS: Record<TransactionKind, string> = {
  income: "Receita",
  expense: "Despesa",
  investment: "Investimento",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  planned: "Previsto",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  debit: "Debito",
  credit: "Credito",
  cash: "Dinheiro",
  transfer: "Transferencia",
};

const ORIGIN_LABELS: Record<string, string> = {
  manual: "Manual",
  open_finance: "Banco",
  bank: "Banco",
  imported: "Banco",
};

function parseMonthKey(dateValue: unknown): string {
  const [year, month] = String(dateValue || "").split("-");
  if (!year || !month) return "";
  return `${year}-${month}`;
}

export function normalizeTransactionType(type: unknown): string {
  return VALID_TYPES.has(String(type)) ? String(type) : "expense";
}

export function getTransactionTypeLabel(type: unknown): string {
  return TYPE_LABELS[normalizeTransactionType(type)] || TYPE_LABELS.expense;
}

export function getTransactionStatusLabel(status: unknown): string {
  return STATUS_LABELS[String(status)] || STATUS_LABELS.paid;
}

export function getPaymentMethodLabel(paymentMethod: unknown): string {
  return PAYMENT_METHOD_LABELS[String(paymentMethod)] || "Outro";
}

export function getTransactionOriginLabel(origin: unknown): string {
  return ORIGIN_LABELS[String(origin)] || ORIGIN_LABELS.manual;
}

export function getTransactionFlowLabel(type: unknown, paymentMethod: unknown): string {
  const normalizedType = normalizeTransactionType(type);
  if (normalizedType === "income") return "Entrada";
  if (normalizedType === "investment") return "Aporte";
  return getPaymentMethodLabel(paymentMethod);
}

export function getTransactionAmountPresentation(type: unknown): AmountPresentation {
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
}: BuildMonthTransactionListInput = {}) {
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
      origin: item?.origin || item?.source || (item?.importedTransactionId ? "open_finance" : "manual"),
    }))
    .map((item) => ({
      ...item,
      presentation: {
        typeLabel: getTransactionTypeLabel(item.type),
        statusLabel: getTransactionStatusLabel(item.status),
        paymentMethodLabel: getPaymentMethodLabel(item.paymentMethod),
        flowLabel: getTransactionFlowLabel(item.type, item.paymentMethod),
        originLabel: getTransactionOriginLabel(item.origin),
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
