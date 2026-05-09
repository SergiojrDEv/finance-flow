import { ConnectInstitutionUseCase } from "../../application/openfinance/ConnectInstitutionUseCase.js";
import { ImportTransactionsUseCase } from "../../application/openfinance/ImportTransactionsUseCase.js";
import { ReviewImportedTransactionUseCase } from "../../application/openfinance/ReviewImportedTransactionUseCase.js";
import { LocalBankConnectionRepository } from "../openfinance/LocalBankConnectionRepository.js";
import { LocalImportedTransactionRepository } from "../openfinance/LocalImportedTransactionRepository.js";
import { MockOpenFinanceProvider } from "../openfinance/MockOpenFinanceProvider.js";

export function createOpenFinanceServices({
  readConnections,
  writeConnections,
  readImportedTransactions,
  writeImportedTransactions,
  createConnectionId,
  createImportedTransactionId,
  provider = new MockOpenFinanceProvider(),
  clock = () => new Date(),
} = {}) {
  const connectionRepository = new LocalBankConnectionRepository({
    readConnections,
    writeConnections,
    createId: createConnectionId,
  });
  const importedTransactionRepository = new LocalImportedTransactionRepository({
    readImportedTransactions,
    writeImportedTransactions,
    createId: createImportedTransactionId,
  });

  return {
    connectionRepository,
    importedTransactionRepository,
    provider,
    connectInstitution: new ConnectInstitutionUseCase({ connectionRepository, provider, clock }),
    importTransactions: new ImportTransactionsUseCase({ connectionRepository, importedTransactionRepository, provider, clock }),
    reviewImportedTransaction: new ReviewImportedTransactionUseCase({ importedTransactionRepository, clock }),
  };
}
