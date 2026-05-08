import { validateCategoryBudgetDraft } from "../../application/budget/validateCategoryBudgetDraft.js";
import type { CategoryBudgetDraft, CategoryBudgetEntity, ValidationErrors } from "../../application/shared/applicationTypes.js";

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeAmount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0;
}

export class CategoryBudget implements CategoryBudgetEntity {
  id: string | null;
  categorySlug: string;
  weeklyLimit: number;
  monthlyLimit: number;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(props: CategoryBudgetEntity) {
    this.id = props.id || null;
    this.categorySlug = props.categorySlug;
    this.weeklyLimit = props.weeklyLimit;
    this.monthlyLimit = props.monthlyLimit;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;

    Object.freeze(this);
  }

  static create(draft: CategoryBudgetDraft): { ok: true; value: CategoryBudget } | { ok: false; errors: ValidationErrors } {
    const normalized = {
      ...draft,
      id: draft.id || null,
      categorySlug: normalizeText(draft.categorySlug),
      weeklyLimit: normalizeAmount(draft.weeklyLimit),
      monthlyLimit: normalizeAmount(draft.monthlyLimit),
      createdAt: draft.createdAt || null,
      updatedAt: draft.updatedAt || null,
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

  toJSON(): CategoryBudgetEntity {
    return { ...this };
  }
}
