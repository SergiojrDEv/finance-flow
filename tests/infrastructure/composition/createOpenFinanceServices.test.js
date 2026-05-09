import assert from "node:assert/strict";
import test from "node:test";
import { createOpenFinanceServices } from "../../../src/infrastructure/composition/createOpenFinanceServices.js";

test("monta servicos Open Finance com repositorios locais e provider mock", async () => {
  let connections = [];
  let importedTransactions = [];
  const services = createOpenFinanceServices({
    readConnections: () => connections,
    writeConnections: (nextConnections) => {
      connections = nextConnections;
    },
    readImportedTransactions: () => importedTransactions,
    writeImportedTransactions: (nextImportedTransactions) => {
      importedTransactions = nextImportedTransactions;
    },
    createConnectionId: () => "conn-1",
    createImportedTransactionId: (transaction) => `imported:${transaction.externalId}`,
    clock: () => new Date("2026-05-09T10:00:00.000Z"),
  });

  const connection = await services.connectInstitution.execute({ userId: "user-1", institutionId: "nubank" });
  const imported = await services.importTransactions.execute("conn-1");

  assert.equal(connection.ok, true);
  assert.equal(imported.ok, true);
  assert.equal(connections[0].institutionName, "Nubank");
  assert.equal(importedTransactions.length, 3);
});
