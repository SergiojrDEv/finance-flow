import { validateGoalDraft } from "../../application/goals/validateGoalDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

export class Goal {
  constructor(props) {
    this.id = props.id || null;
    this.name = props.name;
    this.key = props.key;
    this.target = props.target;
    this.currentAmount = props.currentAmount;
    this.color = props.color;
    this.isArchived = Boolean(props.isArchived);
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft) {
    const normalized = {
      ...draft,
      name: normalizeText(draft.name),
      key: normalizeText(draft.key),
      target: normalizeAmount(draft.target),
      currentAmount: normalizeAmount(draft.currentAmount),
      color: draft.color || "#635bff",
      isArchived: Boolean(draft.isArchived),
    };

    const validation = validateGoalDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new Goal(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
