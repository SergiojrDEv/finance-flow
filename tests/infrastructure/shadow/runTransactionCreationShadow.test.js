import assert from "node:assert/strict";
import test from "node:test";
import { createTransactionServices } from "../../../src/infrastructure/composition/createTransactionServices.js";
import { runTransactionCreationShadow } from "../../../src/infrastructure/shadow/runTransactionCreationShadow.js";

function createServices() {
  let rows = [];
  return createTransactionServices({
    readTransactions: () => rows,
    writeTransactions: (nextRows) => {
      rows = nextRows;
    },
    createId: () => "shadow-1",
    clock: () => new Date("2026-04-24T12:00:00.000Z"),
  });
}

function toDraft(transaction) {
  return {
    userId: "user-1",
    ...transaction,
  };
}

test("nao executa quando shadow esta desligado", async () => {
  const events = [];
  const result = await runTransactionCreationShadow({
    enabled: false,
    transactions: [{ type: "income" }],
    toDraft,
    createTransaction: createServices().createTransaction,
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.ran, false);
  assert.equal(events.length, 0);
});

test("executa sem diagnostico quando legado e novo fluxo batem", async () => {
  const events = [];
  const transaction = {
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 1000,
    date: "2026-04-24",
    status: "paid",
  };

  const result = await runTransactionCreationShadow({
    enabled: true,
    transactions: [transaction],
    toDraft,
    createTransaction: createServices().createTransaction,
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.ran, true);
  assert.equal(result.divergences.length, 0);
  assert.equal(events.length, 0);
});

test("registra diagnostico quando ha divergencia", async () => {
  const events = [];
  const result = await runTransactionCreationShadow({
    enabled: true,
    transactions: [{
      type: "income",
      description: "Salario",
      category: "salario",
      account: "Conta corrente",
      amount: 999,
      date: "2026-04-24",
      status: "paid",
    }],
    toDraft: (transaction) => ({ ...toDraft(transaction), amount: 1000 }),
    createTransaction: createServices().createTransaction,
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.divergences.length, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].scope, "transaction-create");
});

test("registra erro sem lancar excecao", async () => {
  const events = [];
  const result = await runTransactionCreationShadow({
    enabled: true,
    transactions: [{ type: "income" }],
    toDraft: () => {
      throw new Error("falha simulada");
    },
    createTransaction: createServices().createTransaction,
    recordDiagnostic: (event) => events.push(event),
  });

  assert.equal(result.ran, true);
  assert.equal(result.error.message, "falha simulada");
  assert.equal(events[0].level, "error");
});
