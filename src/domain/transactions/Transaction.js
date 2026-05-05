import { validateTransactionDraft } from "../../application/transactions/validateTransactionDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

function pickExpenseFields(draft) {
  if (draft.type !== "expense") return {};

  return {
    subcategory: normalizeText(draft.subcategory),
    paymentMethod: normalizeText(draft.paymentMethod),
    creditCardId: normalizeText(draft.creditCardId),
    dueDate: normalizeText(draft.dueDate),
    recurrence: normalizeText(draft.recurrence || "none"),
    recurrenceId: normalizeText(draft.recurrenceId),
    installmentGroup: normalizeText(draft.installmentGroup),
    installmentNumber: draft.installmentNumber ? Number(draft.installmentNumber) : null,
    installmentTotal: draft.installmentTotal ? Number(draft.installmentTotal) : null,
    repeatCount: Number(draft.repeatCount || 1),
  };
}

export class Transaction {
  constructor(props) {
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

  static create(draft) {
    const validation = validateTransactionDraft(draft);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    const normalized = {
      id: draft.id || null,
      userId: normalizeText(draft.userId),
      type: draft.type,
      description: normalizeText(draft.description),
      category: normalizeText(draft.category),
      account: normalizeText(draft.account),
      amount: normalizeAmount(draft.amount),
      date: normalizeText(draft.date),
      status: normalizeText(draft.status || "paid"),
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
      ...pickExpenseFields(draft),
    };

    return {
      ok: true,
      value: new Transaction(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
