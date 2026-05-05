const VALID_KINDS = new Set(["income", "expense", "investment"]);
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isNonEmpty(value) {
  return String(value || "").trim().length > 0;
}

export function validateCategoryTagDraft(draft = {}) {
  const errors = {};

  if (!VALID_KINDS.has(draft.kind)) {
    errors.kind = "Tipo da etiqueta invalido.";
  }

  if (!isNonEmpty(draft.categorySlug)) {
    errors.categorySlug = "Categoria principal e obrigatoria.";
  }

  if (!isNonEmpty(draft.slug)) {
    errors.slug = "Identificador da etiqueta e obrigatorio.";
  }

  if (!isNonEmpty(draft.name)) {
    errors.name = "Nome da etiqueta e obrigatorio.";
  }

  if (draft.color && !HEX_COLOR.test(draft.color)) {
    errors.color = "Cor deve estar no formato hexadecimal.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
