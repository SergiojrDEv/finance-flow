import { validateTransactionDraft } from "../../application/transactions/validateTransactionDraft.js";
import type {
  PaymentMethod,
  TransactionDraft,
  TransactionEntity,
  TransactionKind,
  TransactionStatus,
  ValidationErrors,
} from "../../application/shared/applicationTypes.js";

type TransactionCreateResult =
  | { ok: true; value: Transaction }
  | { ok: false; errors: ValidationErrors };

type ExpenseFields = Pick<
  TransactionEntity,
  | "subcategory"
  | "paymentMethod"
  | "creditCardId"
  | "dueDate"
  | "recurrence"
  | "recurrenceId"
  | "installmentGroup"
  | "installmentNumber"
  | "installmentTotal"
  | "repeatCount"
>;

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeAmount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

function normalizeOptionalNumber(value: unknown): number | null {
  return value ? Number(value) : null;
}

function pickExpenseFields(draft: TransactionDraft): Partial<ExpenseFields> {
  if (draft.type !== "expense") return {};

  return {
    subcategory: normalizeText(draft.subcategory),
    paymentMethod: normalizeText(draft.paymentMethod) as PaymentMethod | string,
    creditCardId: normalizeText(draft.creditCardId),
    dueDate: normalizeText(draft.dueDate),
    recurrence: normalizeText(draft.recurrence || "none"),
    recurrenceId: normalizeText(draft.recurrenceId),
    installmentGroup: normalizeText(draft.installmentGroup),
    installmentNumber: normalizeOptionalNumber(draft.installmentNumber),
    installmentTotal: normalizeOptionalNumber(draft.installmentTotal),
    repeatCount: Number(draft.repeatCount || 1),
  };
}

export class Transaction implements TransactionEntity {
  readonly id: string | null;
  readonly userId: string;
  readonly type: TransactionKind;
  readonly description: string;
  readonly category: string;
  readonly subcategory?: string | null;
  readonly account: string;
  readonly amount: number;
  readonly date: string;
  readonly dueDate?: string;
  readonly status: TransactionStatus;
  readonly paymentMethod?: PaymentMethod | string;
  readonly creditCardId?: string | null;
  readonly recurrence?: string;
  readonly recurrenceId?: string | null;
  readonly installmentGroup?: string | null;
  readonly installmentNumber?: number | null;
  readonly installmentTotal?: number | null;
  readonly repeatCount?: number;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;

  constructor(props: TransactionEntity) {
    this.id = props.id || null;
    this.userId = props.userId;
    this.type = props.type;
    this.description = props.description;
    this.category = props.category;
    this.account = props.account;
    this.amount = props.amount;
    this.date = props.date;
    this.status = props.status;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    if (props.type === "expense") {
      this.subcategory = props.subcategory || "";
      this.paymentMethod = props.paymentMethod || "";
      this.creditCardId = props.creditCardId || null;
      this.dueDate = props.dueDate || "";
      this.recurrence = props.recurrence || "none";
      this.recurrenceId = props.recurrenceId || null;
      this.installmentGroup = props.installmentGroup || null;
      this.installmentNumber = props.installmentNumber || null;
      this.installmentTotal = props.installmentTotal || null;
      this.repeatCount = props.repeatCount || 1;
    }

    Object.freeze(this);
  }

  static create(draft: TransactionDraft = {}): TransactionCreateResult {
    const validation = validateTransactionDraft(draft);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    const normalized: TransactionEntity = {
      id: draft.id || null,
      userId: normalizeText(draft.userId),
      type: draft.type as TransactionKind,
      description: normalizeText(draft.description),
      category: normalizeText(draft.category),
      account: normalizeText(draft.account),
      amount: normalizeAmount(draft.amount),
      date: normalizeText(draft.date),
      status: normalizeText(draft.status || "paid") as TransactionStatus,
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
      ...pickExpenseFields(draft),
    };

    return {
      ok: true,
      value: new Transaction(normalized),
    };
  }

  toJSON(): TransactionEntity {
    return { ...this };
  }
}
