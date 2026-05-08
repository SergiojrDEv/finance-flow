import type { CategoryBudgetDraft, ValidationResult, ValidationErrors } from "../shared/applicationTypes.js";

function isNonEmpty(value: unknown): boolean {
  return String(value || "").trim().length > 0;
}

function isValidAmount(value: unknown): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

export function validateCategoryBudgetDraft(draft: CategoryBudgetDraft = {}): ValidationResult {
  const errors: ValidationErrors = {};

  if (!isNonEmpty(draft.categorySlug)) {
    errors.categorySlug = "Categoria e obrigatoria.";
  }

  if (!isValidAmount(draft.weeklyLimit)) {
    errors.weeklyLimit = "Limite semanal nao pode ser negativo.";
  }

  if (!isValidAmount(draft.monthlyLimit)) {
    errors.monthlyLimit = "Limite mensal nao pode ser negativo.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
