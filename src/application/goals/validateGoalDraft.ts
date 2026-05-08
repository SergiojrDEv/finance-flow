import type { GoalDraft, ValidationResult, ValidationErrors } from "../shared/applicationTypes.js";

function isNonEmpty(value: unknown): boolean {
  return String(value || "").trim().length > 0;
}

function isValidAmount(value: unknown): boolean {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

export function validateGoalDraft(draft: GoalDraft = {}): ValidationResult {
  const errors: ValidationErrors = {};

  if (!isNonEmpty(draft.name)) {
    errors.name = "Nome da meta e obrigatorio.";
  }

  if (!isNonEmpty(draft.key)) {
    errors.key = "Categoria da meta e obrigatoria.";
  }

  if (!isValidAmount(draft.target)) {
    errors.target = "Valor alvo deve ser maior que zero.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
