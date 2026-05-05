import assert from "node:assert/strict";
import test from "node:test";
import { buildTransactionHighlights } from "../../../src/application/dashboard/buildTransactionHighlights.js";

test("resume lancamentos do mes sem misturar entradas e saidas", () => {
  const summary = buildTransactionHighlights([
    { type: "income", amount: 3100, status: "paid", paymentMethod: "transfer" },
    { type: "expense", amount: 100.12, status: "paid", paymentMethod: "pix" },
    { type: "expense", amount: "50.11", status: "pending", paymentMethod: "credit" },
    { type: "investment", amount: 200, status: "paid", paymentMethod: "transfer" },
  ]);

  assert.equal(summary.count, 4);
  assert.equal(summary.status.paid, 3);
  assert.equal(summary.status.pending, 1);
  assert.equal(summary.payments.pix, 1);
  assert.equal(summary.payments.credit, 1);
  assert.equal(summary.totals.income, 3100);
  assert.equal(summary.totals.outflow, 350.23);
});

test("retorna zeros quando nao ha lancamentos", () => {
  const summary = buildTransactionHighlights([]);

  assert.equal(summary.count, 0);
  assert.equal(summary.status.paid, 0);
  assert.equal(summary.totals.income, 0);
  assert.equal(summary.totals.outflow, 0);
});
