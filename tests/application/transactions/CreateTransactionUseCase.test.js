import assert from "node:assert/strict";
import test from "node:test";
import { CreateTransactionUseCase } from "../../../src/application/transactions/CreateTransactionUseCase.js";
import { InMemoryTransactionRepository } from "../../support/InMemoryTransactionRepository.js";

const fixedClock = () => new Date("2026-04-24T12:00:00.000Z");

test("cria e salva uma transacao valida pelo caso de uso", async () => {
  const repository = new InMemoryTransactionRepository();
  const useCase = new CreateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    userId: "user-1",
    type: "expense",
    description: "Supermercado",
    category: "alimentacao",
    account: "Conta corrente",
    amount: 150,
    date: "2026-04-24",
    status: "paid",
    paymentMethod: "pix",
    dueDate: "2026-04-30",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "tx-1");
  assert.equal(result.value.createdAt, "2026-04-24T12:00:00.000Z");
  assert.equal(repository.all().length, 1);
});

test("nao salva quando o dominio recusa o draft", async () => {
  const repository = new InMemoryTransactionRepository();
  const useCase = new CreateTransactionUseCase({ transactionRepository: repository, clock: fixedClock });

  const result = await useCase.execute({
    userId: "",
    type: "income",
    description: "",
    category: "salario",
    account: "Conta corrente",
    amount: 0,
    date: "2026-04-24",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.userId, "Usuario autenticado e obrigatorio.");
  assert.equal(result.errors.description, "Descricao e obrigatoria.");
  assert.equal(result.errors.amount, "Valor deve ser maior que zero.");
  assert.equal(repository.all().length, 0);
});

test("exige um repositorio com metodo save", () => {
  assert.throws(
    () => new CreateTransactionUseCase({ transactionRepository: {} }),
    /transactionRepository.save e obrigatorio/
  );
});
