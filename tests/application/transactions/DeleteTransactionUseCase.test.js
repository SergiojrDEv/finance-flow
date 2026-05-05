import assert from "node:assert/strict";
import test from "node:test";
import { DeleteTransactionUseCase } from "../../../src/application/transactions/DeleteTransactionUseCase.js";
import { InMemoryTransactionRepository } from "../../support/InMemoryTransactionRepository.js";

const existingTransaction = {
  id: "tx-1",
  userId: "user-1",
  type: "expense",
  description: "Mercado",
  category: "alimentacao",
  account: "Carteira",
  amount: 80,
  date: "2026-04-24",
};

test("remove lancamento existente", async () => {
  const repository = new InMemoryTransactionRepository([existingTransaction]);
  const useCase = new DeleteTransactionUseCase({ transactionRepository: repository });

  const result = await useCase.execute("tx-1", { userId: "user-1" });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "tx-1");
  assert.equal(repository.all().length, 0);
});

test("recusa remover lancamento inexistente", async () => {
  const repository = new InMemoryTransactionRepository([]);
  const useCase = new DeleteTransactionUseCase({ transactionRepository: repository });

  const result = await useCase.execute("tx-404", { userId: "user-1" });

  assert.equal(result.ok, false);
  assert.equal(result.errors.id, "Lancamento nao encontrado.");
});

test("recusa remover lancamento de outro usuario", async () => {
  const repository = new InMemoryTransactionRepository([existingTransaction]);
  const useCase = new DeleteTransactionUseCase({ transactionRepository: repository });

  const result = await useCase.execute("tx-1", { userId: "user-2" });

  assert.equal(result.ok, false);
  assert.equal(result.errors.userId, "Lancamento pertence a outro usuario.");
  assert.equal(repository.all().length, 1);
});

test("exige repositorio com findById e deleteById", () => {
  assert.throws(
    () => new DeleteTransactionUseCase({ transactionRepository: { findById: async () => null } }),
    /transactionRepository.deleteById e obrigatorio/
  );
});
