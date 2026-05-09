import assert from "node:assert/strict";
import test from "node:test";
import { ImportedTransaction } from "../../../src/domain/openfinance/ImportedTransaction.js";

test("cria transacao importada imutavel e normalizada", () => {
  const result = ImportedTransaction.create({
    connectionId: " conn-1 ",
    externalId: " ext-1 ",
    description: " Mercado ",
    type: "expense",
    amount: "19.999",
    date: "2026-05-09",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.connectionId, "conn-1");
  assert.equal(result.value.description, "Mercado");
  assert.equal(result.value.amount, 20);
  assert.equal(result.value.status, "pending_review");
  assert.equal(Object.isFrozen(result.value), true);
});

test("recusa transacao importada invalida", () => {
  const result = ImportedTransaction.create({
    type: "transfer",
    amount: 0,
    date: "09/05/2026",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.connectionId, "Conexao e obrigatoria.");
  assert.equal(result.errors.type, "Tipo de movimento invalido.");
  assert.equal(result.errors.date, "Data deve estar no formato YYYY-MM-DD.");
});
