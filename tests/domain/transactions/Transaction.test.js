import assert from "node:assert/strict";
import test from "node:test";
import { Transaction } from "../../../src/domain/transactions/Transaction.js";

test("cria uma transacao de despesa valida e imutavel", () => {
  const result = Transaction.create({
    id: "tx-1",
    userId: "user-1",
    type: "expense",
    description: " Supermercado ",
    category: "alimentacao",
    subcategory: "mercado",
    account: "Conta corrente",
    amount: "120.505",
    date: "2026-04-24",
    status: "paid",
    paymentMethod: "pix",
    dueDate: "2026-04-30",
    recurrence: "none",
    repeatCount: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.description, "Supermercado");
  assert.equal(result.value.amount, 120.51);
  assert.equal(result.value.paymentMethod, "pix");
  assert.equal(Object.isFrozen(result.value), true);
});

test("cria receita sem campos exclusivos de despesa", () => {
  const result = Transaction.create({
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
  assert.equal("paymentMethod" in result.value, false);
  assert.equal("dueDate" in result.value, false);
  assert.equal(result.value.amount, 5000);
});

test("recusa transacao invalida e devolve erros de dominio", () => {
  const result = Transaction.create({
    userId: "",
    type: "expense",
    description: "",
    category: "",
    account: "",
    amount: -10,
    date: "data ruim",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.userId, "Usuario autenticado e obrigatorio.");
  assert.equal(result.errors.amount, "Valor deve ser maior que zero.");
  assert.equal(result.errors.date, "Data invalida.");
});
