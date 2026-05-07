import { mapLocalTransactionToLegacyRow } from "./LegacyTransactionMapper.js";

export function buildLegacySyncPayload({
  userId,
  transactions = [],
  settings = {},
  parseLocalDate,
  now,
} = {}) {
  if (!userId) throw new Error("userId e obrigatorio.");
  if (!parseLocalDate || typeof parseLocalDate !== "function") {
    throw new Error("parseLocalDate e obrigatorio.");
  }

  return {
    userId,
    rows: transactions.map((item) => mapLocalTransactionToLegacyRow(item, {
      userId,
      parseLocalDate,
      now,
    })),
    settings,
    localIds: transactions.map((item) => item.id),
  };
}
