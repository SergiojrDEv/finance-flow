import assert from "node:assert/strict";
import test from "node:test";
import { CreateTransactionUseCase } from "../../../src/application/transactions/CreateTransactionUseCase.js";
import { CreateTransactionSeriesUseCase } from "../../../src/application/transactions/CreateTransactionSeriesUseCase.js";
import { InMemoryTransactionRepository } from "../../support/InMemoryTransactionRepository.js";

test("salva uma serie de lancamentos validos", async () => {
  const repository = new InMemoryTransactionRepository();
  const createTransaction = new CreateTransactionUseCase({
    transactionRepository: repository,
    clock: () => new Date("2026-05-06T10:00:00.000Z"),
  });
  const useCase = new CreateTransactionSeriesUseCase({ createTransaction });

  const result = await useCase.execute([
    {
      userId: "user-1",
      type: "expense",
      description: "Parcela 1",
      category: "outros",
      account: "Cartao",
      amount: 100,
      date: "2026-05-06",
      status: "paid",
      paymentMethod: "credit",
      dueDate: "2026-05-10",
    },
    {
      userId: "user-1",
      type: "expense",
      description: "Parcela 2",
      category: "outros",
      account: "Cartao",
      amount: 100,
      date: "2026-06-06",
      status: "paid",
      paymentMethod: "credit",
      dueDate: "2026-06-10",
    },
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.value.length, 2);
  assert.equal(repository.all().length, 2);
});

test("para a serie quando um lancamento e invalido", async () => {
  const repository = new InMemoryTransactionRepository();
  const createTransaction = new CreateTransactionUseCase({ transactionRepository: repository });
  const useCase = new CreateTransactionSeriesUseCase({ createTransaction });

  const result = await useCase.execute([
    {
      userId: "user-1",
      type: "income",
      description: "Salario",
      category: "salario",
      account: "Conta corrente",
      amount: 1000,
      date: "2026-05-06",
    },
    {
      userId: "",
      type: "expense",
      description: "",
      category: "outros",
      account: "Cartao",
      amount: 0,
      date: "2026-05-06",
    },
  ]);

  assert.equal(result.ok, false);
  assert.equal(result.values.length, 1);
  assert.equal(repository.all().length, 1);
  assert.equal(result.errors.userId, "Usuario autenticado e obrigatorio.");
});

test("recusa serie vazia", async () => {
  const useCase = new CreateTransactionSeriesUseCase({
    createTransaction: { execute: async () => ({ ok: true }) },
  });

  const result = await useCase.execute([]);

  assert.equal(result.ok, false);
  assert.equal(result.errors.transactions, "Nenhum lancamento informado.");
});
