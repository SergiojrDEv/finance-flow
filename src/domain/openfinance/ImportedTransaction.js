import { validateImportedTransactionDraft } from "../../application/openfinance/validateImportedTransactionDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

export class ImportedTransaction {
  constructor(props) {
    this.id = props.id || null;
    this.connectionId = props.connectionId;
    this.externalId = props.externalId;
    this.description = props.description;
    this.type = props.type;
    this.amount = props.amount;
    this.date = props.date;
    this.status = props.status || "pending_review";
    this.matchedTransactionId = props.matchedTransactionId || null;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft = {}) {
    const normalized = {
      ...draft,
      connectionId: normalizeText(draft.connectionId),
      externalId: normalizeText(draft.externalId),
      description: normalizeText(draft.description),
      type: normalizeText(draft.type),
      amount: normalizeAmount(draft.amount),
      date: normalizeText(draft.date),
      status: normalizeText(draft.status || "pending_review"),
      matchedTransactionId: normalizeText(draft.matchedTransactionId) || null,
    };

    const validation = validateImportedTransactionDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new ImportedTransaction(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
