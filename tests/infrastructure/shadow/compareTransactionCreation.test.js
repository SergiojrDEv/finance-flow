import assert from "node:assert/strict";
import test from "node:test";
import { createTransactionServices } from "../../../src/infrastructure/composition/createTransactionServices.js";
import { compareTransactionCreation } from "../../../src/infrastructure/shadow/compareTransactionCreation.js";

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

test("confirma quando legado e arquitetura nova geram campos equivalentes", async () => {
  const services = createServices();
  const draft = {
    userId: "user-1",
    type: "expense",
    description: "Mercado",
    category: "alimentacao",
    subcategory: "mercado",
    account: "Carteira",
    amount: 99.9,
    date: "2026-04-24",
    dueDate: "2026-04-24",
    status: "paid",
    paymentMethod: "pix",
    recurrence: "none",
  };

  const result = await compareTransactionCreation({
    draft,
    legacyTransaction: { id: "legacy-1", ...draft },
    createTransaction: services.createTransaction,
  });

  assert.equal(result.ok, true);
  assert.equal(result.matched, true);
  assert.deepEqual(result.diffs, {});
});

test("aponta divergencias entre legado e arquitetura nova", async () => {
  const services = createServices();
  const result = await compareTransactionCreation({
    draft: {
      userId: "user-1",
      type: "income",
      description: "Salario",
      category: "salario",
      account: "Conta corrente",
      amount: 5000,
      date: "2026-04-24",
      status: "paid",
    },
    legacyTransaction: {
      type: "income",
      description: "Salario",
      category: "salario",
      account: "Conta corrente",
      amount: 4999,
      date: "2026-04-24",
      status: "paid",
    },
    createTransaction: services.createTransaction,
  });

  assert.equal(result.matched, false);
  assert.deepEqual(result.diffs.amount, { legacy: 4999, modern: 5000 });
});

test("retorna erros quando a arquitetura nova recusa o draft", async () => {
  const services = createServices();
  const result = await compareTransactionCreation({
    draft: {
      userId: "",
      type: "expense",
      description: "",
      category: "alimentacao",
      account: "Carteira",
      amount: 0,
      date: "2026-04-24",
    },
    legacyTransaction: {},
    createTransaction: services.createTransaction,
  });

  assert.equal(result.ok, false);
  assert.equal(result.matched, false);
  assert.equal(result.errors.userId, "Usuario autenticado e obrigatorio.");
});
