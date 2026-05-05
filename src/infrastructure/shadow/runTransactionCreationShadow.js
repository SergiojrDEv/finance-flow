import { recordShadowDiagnostic } from "../diagnostics/shadowDiagnostics.js";
import { compareTransactionCreation } from "./compareTransactionCreation.js";

export async function runTransactionCreationShadow({
  enabled,
  transactions = [],
  toDraft,
  createTransaction,
  recordDiagnostic = recordShadowDiagnostic,
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
        draft: toDraft(transaction),
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
