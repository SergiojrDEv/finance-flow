function normalizeText(value) {
  return String(value || "").trim();
}

export function validateBankConnectionDraft(draft = {}) {
  const errors = {};

  if (!normalizeText(draft.userId)) errors.userId = "Usuario e obrigatorio.";
  if (!normalizeText(draft.provider)) errors.provider = "Provider e obrigatorio.";
  if (!normalizeText(draft.institutionId)) errors.institutionId = "Instituicao e obrigatoria.";
  if (!normalizeText(draft.institutionName)) errors.institutionName = "Nome da instituicao e obrigatorio.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
