import { recordShadowDiagnostic } from "../diagnostics/shadowDiagnostics.js";
import { compareTransactionCreation } from "./compareTransactionCreation.js";
import type { TransactionDraft } from "../../application/shared/applicationTypes.js";

type TransactionLike = Record<string, unknown>;
type CreateTransactionUseCaseLike = {
  execute: (draft?: TransactionDraft) => Promise<{ ok: boolean; value?: TransactionLike; errors?: Record<string, string> }>;
};

export async function runTransactionCreationShadow({
  enabled,
  transactions = [],
  toDraft,
  createTransaction,
  recordDiagnostic = recordShadowDiagnostic,
}: {
  enabled?: boolean;
  transactions?: TransactionLike[];
  toDraft?: (transaction: TransactionLike) => TransactionDraft;
  createTransaction?: CreateTransactionUseCaseLike;
  recordDiagnostic?: (event: Record<string, unknown>) => unknown;
} = {}) {
  if (!enabled) {
    return {
      ran: false,
      divergences: [],
    };
  }

  try {
    const results = await Promise.all(transactions.map((transaction) =>
      compareTransactionCreation({
        draft: toDraft?.(transaction),
        legacyTransaction: transaction,
        createTransaction,
      })
    ));
    const divergences = results.filter((result) => !result.matched);

    if (divergences.length) {
      recordDiagnostic({
        scope: "transaction-create",
        details: { divergences },
      });
    }

    return {
      ran: true,
      divergences,
    };
  } catch (error) {
    recordDiagnostic({
      scope: "transaction-create",
      level: "error",
      details: { error },
    });

    return {
      ran: true,
      divergences: [],
      error,
    };
  }
}
