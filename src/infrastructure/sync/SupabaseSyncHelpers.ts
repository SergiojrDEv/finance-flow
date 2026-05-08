export function isMissingRelationError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find") || error?.code === "PGRST205";
}

export function inferAccountKind(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("cartao")) return "credit_card";
  if (lower.includes("corretora")) return "investment";
  if (lower.includes("carteira")) return "wallet";
  if (lower.includes("poupanca")) return "savings";
  return "checking";
}
