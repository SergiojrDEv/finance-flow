function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function validateImportedTransactionDraft(draft = {}) {
  const errors = {};
  const type = normalizeText(draft.type);

  if (!normalizeText(draft.connectionId)) errors.connectionId = "Conexao e obrigatoria.";
  if (!normalizeText(draft.externalId)) errors.externalId = "Identificador externo e obrigatorio.";
  if (!normalizeText(draft.description)) errors.description = "Descricao e obrigatoria.";
  if (!["income", "expense", "investment"].includes(type)) errors.type = "Tipo de movimento invalido.";
  if (normalizeAmount(draft.amount) <= 0) errors.amount = "Valor deve ser maior que zero.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizeText(draft.date))) errors.date = "Data deve estar no formato YYYY-MM-DD.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
