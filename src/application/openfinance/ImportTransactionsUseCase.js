import { ImportedTransaction } from "../../domain/openfinance/ImportedTransaction.js";
import { fail, ok } from "../shared/result.js";

export class ImportTransactionsUseCase {
  constructor({ connectionRepository, importedTransactionRepository, provider, clock = () => new Date() } = {}) {
    if (!connectionRepository || typeof connectionRepository.findById !== "function") {
      throw new Error("connectionRepository.findById e obrigatorio.");
    }
    if (!importedTransactionRepository || typeof importedTransactionRepository.saveMany !== "function") {
      throw new Error("importedTransactionRepository.saveMany e obrigatorio.");
    }
    if (!provider || typeof provider.fetchTransactions !== "function") {
      throw new Error("provider.fetchTransactions e obrigatorio.");
    }

    this.connectionRepository = connectionRepository;
    this.importedTransactionRepository = importedTransactionRepository;
    this.provider = provider;
    this.clock = clock;
  }

  async execute(connectionId) {
    const connection = await this.connectionRepository.findById(connectionId);
    if (!connection) return fail({ connection: "Conexao nao encontrada." });

    const now = this.clock().toISOString();
    const rows = await this.provider.fetchTransactions(connection);
    const imported = [];

    for (const row of rows) {
      const creation = ImportedTransaction.create({
        ...row,
        connectionId: connection.id,
        createdAt: row.createdAt || now,
        updatedAt: row.updatedAt || now,
      });

      if (!creation.ok) return fail(creation.errors);
      imported.push(creation.value);
    }

    return ok(await this.importedTransactionRepository.saveMany(imported));
  }
}
