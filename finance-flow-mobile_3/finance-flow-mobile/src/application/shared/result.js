export function ok(value, metadata = {}) {
  return {
    ok: true,
    value,
    ...metadata,
  };
}

export function fail(errors, metadata = {}) {
  return {
    ok: false,
    errors,
    ...metadata,
  };
}

export function firstErrorMessage(errors, fallback = "Nao foi possivel concluir a operacao.") {
  if (!errors || typeof errors !== "object") return fallback;
  return Object.values(errors).find(Boolean) || fallback;
}
