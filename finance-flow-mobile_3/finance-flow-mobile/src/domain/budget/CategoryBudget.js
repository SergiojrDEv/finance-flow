import { validateCategoryBudgetDraft } from "../../application/budget/validateCategoryBudgetDraft.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

export class CategoryBudget {
  constructor(props) {
    this.id = props.id || null;
    this.categorySlug = props.categorySlug;
    this.weeklyLimit = props.weeklyLimit;
    this.monthlyLimit = props.monthlyLimit;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft) {
    const normalized = {
      ...draft,
      categorySlug: normalizeText(draft.categorySlug),
      weeklyLimit: normalizeAmount(draft.weeklyLimit),
      monthlyLimit: normalizeAmount(draft.monthlyLimit),
    };

    const validation = validateCategoryBudgetDraft(normalized);
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors,
      };
    }

    return {
      ok: true,
      value: new CategoryBudget(normalized),
    };
  }

  toJSON() {
    return { ...this };
  }
}
