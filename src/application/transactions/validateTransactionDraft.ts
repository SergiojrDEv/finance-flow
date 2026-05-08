import { TRANSACTION_TYPES, shouldShowTransactionField } from "./transactionFormRules.js";
import type { TransactionStatus, ValidationResult, ValidationErrors } from "../shared/applicationTypes.js";

type TransactionDraft = Record<string, unknown> & {
  type?: unknown;
  userId?: unknown;
  description?: unknown;
  category?: unknown;
  account?: unknown;
  amount?: unknown;
  date?: unknown;
  status?: unknown;
  dueDate?: unknown;
};

const VALID_TYPES = new Set(Object.values(TRANSACTION_TYPES));
const VALID_STATUSES = new Set<TransactionStatus>(["paid", "pending", "planned"]);

function isNonEmpty(value: unknown): boolean {
  return String(value || "").trim().length > 0;
}

function isValidDate(value: unknown): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function normalizeAmount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function validateTransactionDraft(draft: TransactionDraft = {}): ValidationResult {
  const errors: ValidationErrors = {};
  const type = draft.type;

  if (!VALID_TYPES.has(type)) {
    errors.type = "Tipo de lancamento invalido.";
  }

  if (!isNonEmpty(draft.userId)) {
    errors.userId = "Usuario autenticado e obrigatorio.";
  }

  if (!isNonEmpty(draft.description)) {
    errors.description = "Descricao e obrigatoria.";
  }

  if (!isNonEmpty(draft.category)) {
    errors.category = "Categoria e obrigatoria.";
  }

  if (!isNonEmpty(draft.account)) {
    errors.account = "Conta e obrigatoria.";
  }

  if (normalizeAmount(draft.amount) <= 0) {
    errors.amount = "Valor deve ser maior que zero.";
  }

  if (!isValidDate(draft.date)) {
    errors.date = "Data invalida.";
  }

  if (draft.status && !VALID_STATUSES.has(String(draft.status))) {
    errors.status = "Status invalido.";
  }

  if (type && type !== TRANSACTION_TYPES.expense) {
    [
      "paymentMethod",
      "dueDate",
      "recurrence",
      "repeatCount",
      "creditCardId",
      "installmentGroup",
      "installmentNumber",
      "installmentTotal",
    ].forEach((field) => {
      if (isNonEmpty(draft[field])) {
        errors[field] = "Campo permitido apenas para despesas.";
      }
    });
  }

  if (type === TRANSACTION_TYPES.expense && shouldShowTransactionField(type, "dueDate") && draft.dueDate && !isValidDate(draft.dueDate)) {
    errors.dueDate = "Vencimento invalido.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
