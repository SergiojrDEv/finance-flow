import { validateBankConnectionDraft } from "../../application/openfinance/validateBankConnectionDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

export class BankConnection {
  constructor(props) {
    this.id = props.id || null;
    this.userId = props.userId;
    this.provider = props.provider;
    this.institutionId = props.institutionId;
    this.institutionName = props.institutionName;
    this.status = props.status || "connected";
    this.lastSyncAt = props.lastSyncAt || null;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft = {}) {
    const normalized = {
      ...draft,
      userId: normalizeText(draft.userId),
      provider: normalizeText(draft.provider),
      institutionId: normalizeText(draft.institutionId),
      institutionName: normalizeText(draft.institutionName),
      status: normalizeText(draft.status || "connected"),
    };

    const validation = validateBankConnectionDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new BankConnection(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
