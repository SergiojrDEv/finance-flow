import assert from "node:assert/strict";
import test from "node:test";
import { Transaction } from "../../../src/domain/transactions/Transaction.js";
import { LocalTransactionRepository } from "../../../src/infrastructure/transactions/LocalTransactionRepository.js";

function createStore(initial = []) {
  let rows = [...initial];
  return {
    readTransactions: () => rows,
    writeTransactions: (nextRows) => {
      rows = nextRows;
    },
  };
}

test("salva transacao serializada no armazenamento local", async () => {
  const store = createStore();
  const repository = new LocalTransactionRepository({
    ...store,
    createId: () => "local-1",
  });
  const transaction = Transaction.create({
    userId: "user-1",
    type: "income",
    description: "Salario",
    category: "salario",
    account: "Conta corrente",
    amount: 5000,
    date: "2026-04-24",
    status: "paid",
  }).value;

  const saved = await repository.save(transaction);

  assert.equal(saved.id, "local-1");
  assert.equal(saved.description, "Salario");
  assert.equal(store.readTransactions().length, 1);
});

test("preserva transacoes existentes ao salvar nova transacao", async () => {
  const store = createStore([{ id: "old-1", type: "income", amount: 100 }]);
  const repository = new LocalTransactionRepository({
    ...store,
    createId: () => "local-2",
  });
  const transaction = Transaction.create({
    userId: "user-1",
    type: "expense",
    description: "Mercado",
    category: "alimentacao",
    account: "Carteira",
    amount: 80,
    date: "2026-04-24",
    status: "paid",
  }).value;

  await repository.save(transaction);

  assert.deepEqual(store.readTransactions().map((item) => item.id), ["old-1", "local-2"]);
});

test("exige funcoes de leitura e escrita", () => {
  assert.throws(
    () => new LocalTransactionRepository({ readTransactions: () => [] }),
    /writeTransactions e obrigatorio/
  );
});

test("busca e atualiza transacao por id", async () => {
  const store = createStore([{ id: "tx-1", type: "income", amount: 100 }]);
  const repository = new LocalTransactionRepository({
    ...store,
    createId: () => "local-1",
  });

  assert.equal((await repository.findById("tx-1")).amount, 100);

  const updated = await repository.update("tx-1", {
    id: "tx-1",
    type: "income",
    amount: 250,
    toJSON() {
      return { id: "tx-1", type: "income", amount: 250 };
    },
  });

  assert.equal(updated.amount, 250);
  assert.equal(store.readTransactions()[0].amount, 250);
});

test("remove transacao por id preservando as demais", async () => {
  const store = createStore([
    { id: "tx-1", type: "income", amount: 100 },
    { id: "tx-2", type: "expense", amount: 50 },
  ]);
  const repository = new LocalTransactionRepository({
    ...store,
    createId: () => "local-1",
  });

  const removed = await repository.deleteById("tx-1");

  assert.equal(removed.id, "tx-1");
  assert.deepEqual(store.readTransactions().map((item) => item.id), ["tx-2"]);
});
