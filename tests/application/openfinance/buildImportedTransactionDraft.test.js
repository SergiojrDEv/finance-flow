import assert from "node:assert/strict";
import test from "node:test";

import { buildImportedTransactionDraft } from "../../../src/application/openfinance/buildImportedTransactionDraft.js";

test("converte despesa importada em draft local com origem bancaria", () => {
  const result = buildImportedTransactionDraft({
    importedTransaction: {
      id: "imp-1",
      description: "Uber",
      type: "expense",
      amount: 23.4,
      date: "2026-05-08",
    },
    settings: { accounts: ["Conta corrente"] },
    userId: "user-1",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    userId: "user-1",
    type: "expense",
    description: "Uber",
    category: "outros",
    account: "Conta corrente",
    amount: 23.4,
    date: "2026-05-08",
    status: "paid",
    origin: "open_finance",
    importedTransactionId: "imp-1",
    subcategory: "",
    paymentMethod: "pix",
    dueDate: "2026-05-08",
    recurrence: "none",
    repeatCount: 1,
  });
});

test("converte receita importada sem campos exclusivos de despesa", () => {
  const result = buildImportedTransactionDraft({
    importedTransaction: {
      id: "imp-2",
      description: "Salario empresa",
      type: "income",
      amount: 4500,
      date: "2026-05-05",
    },
    settings: { accounts: [] },
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.category, "salario");
  assert.equal(result.value.account, "Conta corrente");
  assert.equal("paymentMethod" in result.value, false);
  assert.equal("dueDate" in result.value, false);
});

test("recusa transacao importada ausente", () => {
  const result = buildImportedTransactionDraft();

  assert.equal(result.ok, false);
  assert.equal(result.errors.importedTransaction, "Transacao importada nao encontrada.");
});
