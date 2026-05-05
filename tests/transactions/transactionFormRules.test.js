import assert from "node:assert/strict";
import test from "node:test";
import {
  getHiddenTransactionFields,
  getTransactionFormFields,
  shouldShowTransactionField,
} from "../../src/application/transactions/transactionFormRules.js";

test("receita mostra apenas campos comuns", () => {
  assert.deepEqual(getTransactionFormFields("income"), [
    "description",
    "category",
    "account",
    "amount",
    "date",
    "status",
  ]);
  assert.equal(shouldShowTransactionField("income", "paymentMethod"), false);
  assert.equal(shouldShowTransactionField("income", "recurrence"), false);
});

test("investimento mostra apenas campos comuns", () => {
  assert.equal(shouldShowTransactionField("investment", "paymentMethod"), false);
  assert.equal(shouldShowTransactionField("investment", "dueDate"), false);
  assert.deepEqual(getHiddenTransactionFields("investment"), [
    "subcategory",
    "paymentMethod",
    "dueDate",
    "recurrence",
    "repeatCount",
  ]);
});

test("despesa mostra pagamento vencimento e recorrencia", () => {
  assert.equal(shouldShowTransactionField("expense", "paymentMethod"), true);
  assert.equal(shouldShowTransactionField("expense", "dueDate"), true);
  assert.equal(shouldShowTransactionField("expense", "recurrence"), true);
});
