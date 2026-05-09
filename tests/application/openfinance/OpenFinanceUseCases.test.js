import assert from "node:assert/strict";
import test from "node:test";
import { ConnectInstitutionUseCase } from "../../../src/application/openfinance/ConnectInstitutionUseCase.js";
import { ImportTransactionsUseCase } from "../../../src/application/openfinance/ImportTransactionsUseCase.js";
import { ReviewImportedTransactionUseCase } from "../../../src/application/openfinance/ReviewImportedTransactionUseCase.js";

function createConnectionRepository(initial = []) {
  let rows = [...initial];
  return {
    async save(connection) {
      const saved = { ...connection.toJSON(), id: connection.id || "conn-1" };
      rows = [...rows, saved];
      return saved;
    },
    async findById(id) {
      return rows.find((row) => row.id === id) || null;
    },
    async listByUser(userId) {
      return rows.filter((row) => row.userId === userId);
    },
    read() {
      return rows;
    },
  };
}

function createImportedRepository(initial = []) {
  let rows = [...initial];
  return {
    async saveMany(importedTransactions) {
      const saved = importedTransactions.map((transaction, index) => ({
        ...transaction.toJSON(),
        id: transaction.id || `imported-${index + 1}`,
      }));
      rows = [...rows, ...saved];
      return saved;
    },
    async listPendingByConnection(connectionId) {
      return rows.filter((row) => row.connectionId === connectionId && row.status === "pending_review");
    },
    async markReviewed(id, patch) {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      rows[index] = {
        ...rows[index],
        ...patch,
        status: patch.matchedTransactionId ? "matched" : "reviewed",
      };
      return rows[index];
    },
    read() {
      return rows;
    },
  };
}

test("conecta instituicao usando provider e repositorio", async () => {
  const repository = createConnectionRepository();
  const provider = {
    async connectInstitution() {
      return {
        provider: "mock",
        institutionId: "bank-1",
        institutionName: "Banco Mock",
      };
    },
  };
  const useCase = new ConnectInstitutionUseCase({
    connectionRepository: repository,
    provider,
    clock: () => new Date("2026-05-09T10:00:00.000Z"),
  });

  const result = await useCase.execute({ userId: "user-1" });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "conn-1");
  assert.equal(result.value.createdAt, "2026-05-09T10:00:00.000Z");
  assert.equal(repository.read().length, 1);
});

test("importa transacoes pendentes de uma conexao", async () => {
  const connectionRepository = createConnectionRepository([
    { id: "conn-1", userId: "user-1", provider: "mock", institutionId: "bank-1", institutionName: "Banco Mock" },
  ]);
  const importedTransactionRepository = createImportedRepository();
  const provider = {
    async fetchTransactions() {
      return [
        { externalId: "tx-1", description: "Mercado", type: "expense", amount: 80, date: "2026-05-09" },
        { externalId: "tx-2", description: "Salario", type: "income", amount: 3000, date: "2026-05-05" },
      ];
    },
  };
  const useCase = new ImportTransactionsUseCase({
    connectionRepository,
    importedTransactionRepository,
    provider,
    clock: () => new Date("2026-05-09T10:00:00.000Z"),
  });

  const result = await useCase.execute("conn-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.length, 2);
  assert.equal(result.value[0].status, "pending_review");
  assert.equal(result.value[1].connectionId, "conn-1");
});

test("recusa importacao quando conexao nao existe", async () => {
  const useCase = new ImportTransactionsUseCase({
    connectionRepository: createConnectionRepository(),
    importedTransactionRepository: createImportedRepository(),
    provider: { async fetchTransactions() { return []; } },
  });

  const result = await useCase.execute("conn-missing");

  assert.equal(result.ok, false);
  assert.equal(result.errors.connection, "Conexao nao encontrada.");
});

test("marca transacao importada como revisada ou casada", async () => {
  const importedTransactionRepository = createImportedRepository([
    { id: "imported-1", connectionId: "conn-1", status: "pending_review" },
  ]);
  const useCase = new ReviewImportedTransactionUseCase({
    importedTransactionRepository,
    clock: () => new Date("2026-05-09T10:00:00.000Z"),
  });

  const result = await useCase.execute("imported-1", { matchedTransactionId: "tx-local-1" });

  assert.equal(result.ok, true);
  assert.equal(result.value.status, "matched");
  assert.equal(result.value.matchedTransactionId, "tx-local-1");
  assert.equal(result.value.reviewedAt, "2026-05-09T10:00:00.000Z");
});
