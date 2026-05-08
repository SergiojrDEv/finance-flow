import type { CategoryDraft, TransactionKind, ValidationResult, ValidationErrors } from "../shared/applicationTypes.js";

const VALID_KINDS = new Set<TransactionKind>(["income", "expense", "investment"]);
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isNonEmpty(value: unknown): boolean {
  return String(value || "").trim().length > 0;
}

export function validateCategoryDraft(draft: CategoryDraft = {}): ValidationResult {
  const errors: ValidationErrors = {};

  if (!VALID_KINDS.has(String(draft.kind))) {
    errors.kind = "Tipo de categoria invalido.";
  }

  if (!isNonEmpty(draft.name)) {
    errors.name = "Nome da categoria e obrigatorio.";
  }

  if (!isNonEmpty(draft.slug)) {
    errors.slug = "Identificador da categoria e obrigatorio.";
  }

  if (draft.color && !HEX_COLOR.test(String(draft.color))) {
    errors.color = "Cor deve estar no formato hexadecimal.";
  }

  if (draft.kind === "expense" && Number(draft.monthlyLimit || 0) < 0) {
    errors.monthlyLimit = "Limite mensal nao pode ser negativo.";
  }

  if (draft.kind && draft.kind !== "expense" && draft.monthlyLimit != null && Number(draft.monthlyLimit || 0) !== 0) {
    errors.monthlyLimit = "Limite mensal e permitido apenas para despesas.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
