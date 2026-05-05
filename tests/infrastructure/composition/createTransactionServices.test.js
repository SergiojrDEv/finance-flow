import assert from "node:assert/strict";
import test from "node:test";
import { createTransactionServices } from "../../../src/infrastructure/composition/createTransactionServices.js";

test("monta caso de uso com repositorio local", async () => {
  let rows = [];
  const services = createTransactionServices({
    readTransactions: () => rows,
    writeTransactions: (nextRows) => {
      rows = nextRows;
    },
    createId: () => "factory-1",
    clock: () => new Date("2026-04-24T12:00:00.000Z"),
  });

  const result = await services.createTransaction.execute({
    userId: "user-1",
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 5000,
    date: "2026-04-24",
    status: "paid",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "factory-1");
  assert.equal(rows.length, 1);
  assert.equal(typeof services.transactionRepository.save, "function");
  assert.equal(typeof services.updateTransaction.execute, "function");
  assert.equal(typeof services.deleteTransaction.execute, "function");
});

test("propaga erros quando dependencias locais nao existem", () => {
  assert.throws(
    () => createTransactionServices({ readTransactions: () => [] }),
    /writeTransactions e obrigatorio/
  );
});
