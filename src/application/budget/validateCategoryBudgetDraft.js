function isNonEmpty(value) {
  return String(value || "").trim().length > 0;
}

function isValidAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

export function validateCategoryBudgetDraft(draft = {}) {
  const errors = {};

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
