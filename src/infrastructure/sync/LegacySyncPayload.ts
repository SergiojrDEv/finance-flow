import { mapLocalTransactionToLegacyRow } from "./LegacyTransactionMapper.js";
import type { LegacySyncPayload, LocalTransaction, ParseLocalDate, Clock } from "./syncTypes.js";

export function buildLegacySyncPayload({
  userId,
  transactions = [],
  settings = {},
  parseLocalDate,
  now,
}: {
  userId?: string;
  transactions?: LocalTransaction[];
  settings?: Record<string, unknown>;
  parseLocalDate?: ParseLocalDate;
  now?: Clock;
} = {}): LegacySyncPayload {
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
