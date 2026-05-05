import assert from "node:assert/strict";
import test from "node:test";
import { UpdateTransactionUseCase } from "../../../src/application/transactions/UpdateTransactionUseCase.js";
import { InMemoryTransactionRepository } from "../../support/InMemoryTransactionRepository.js";

const fixedClock = () => new Date("2026-04-25T10:00:00.000Z");

const existingExpense = {
  id: "tx-1",
  userId: "user-1",
  type: "expense",
  description: "Mercado",
  category: "alimentacao",
  subcategory: "mercado",
  account: "Carteira",
  amount: 80,
  date: "2026-04-24",
  dueDate: "2026-04-24",
  status: "paid",
  paymentMethod: "pix",
  recurrence: "none",
  createdAt: "2026-04-24T12:00:00.000Z",
  updatedAt: "2026-04-24T12:00:00.000Z",
};

test("atualiza lancamento existente preservando createdAt", async () => {
  const repository = new InMemoryTransactionRepository([existingExpense]);
  const useCase = new UpdateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute("tx-1", {
    userId: "user-1",
    type: "expense",
    description: "Mercado atualizado",
    category: "alimentacao",
    account: "Carteira",
    amount: 95.5,
    date: "2026-04-24",
    status: "paid",
    paymentMethod: "pix",
    dueDate: "2026-04-24",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.description, "Mercado atualizado");
  assert.equal(result.value.amount, 95.5);
  assert.equal(result.value.createdAt, "2026-04-24T12:00:00.000Z");
  assert.equal(result.value.updatedAt, "2026-04-25T10:00:00.000Z");
});

test("recusa editar lancamento inexistente", async () => {
  const repository = new InMemoryTransactionRepository([]);
  const useCase = new UpdateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute("nao-existe", {
    userId: "user-1",
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 1000,
    date: "2026-04-24",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.id, "Lancamento nao encontrado.");
});

test("recusa editar lancamento de outro usuario", async () => {
  const repository = new InMemoryTransactionRepository([existingExpense]);
  const useCase = new UpdateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute("tx-1", {
    userId: "user-2",
    type: "expense",
    description: "Mercado",
    category: "alimentacao",
    account: "Carteira",
    amount: 80,
    date: "2026-04-24",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.userId, "Lancamento pertence a outro usuario.");
});

test("recusa receita com campo exclusivo de despesa", async () => {
  const repository = new InMemoryTransactionRepository([{ ...existingExpense, type: "income", category: "salario" }]);
  const useCase = new UpdateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute("tx-1", {
    userId: "user-1",
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 1000,
    date: "2026-04-24",
    paymentMethod: "pix",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.paymentMethod, "Campo permitido apenas para despesas.");
});
