import { CreateTransactionUseCase } from "../../application/transactions/CreateTransactionUseCase.js";
import { CreateTransactionSeriesUseCase } from "../../application/transactions/CreateTransactionSeriesUseCase.js";
import { DeleteTransactionUseCase } from "../../application/transactions/DeleteTransactionUseCase.js";
import { UpdateTransactionUseCase } from "../../application/transactions/UpdateTransactionUseCase.js";
import { LocalTransactionRepository } from "../transactions/LocalTransactionRepository.js";
import type { TransactionEntity } from "../../application/shared/applicationTypes.js";

type CreateTransactionServicesDeps = {
  readTransactions?: () => TransactionEntity[];
  writeTransactions?: (transactions: TransactionEntity[]) => void;
  createId?: () => string;
  clock?: () => string;
};

export function createTransactionServices({
  readTransactions,
  writeTransactions,
  createId,
  clock,
}: CreateTransactionServicesDeps = {}) {
  const transactionRepository = new LocalTransactionRepository({
    readTransactions,
    writeTransactions,
    createId,
  });

  const createTransaction = new CreateTransactionUseCase({
    transactionRepository,
    clock,
  });

  return {
    transactionRepository,
    createTransaction,
    createTransactionSeries: new CreateTransactionSeriesUseCase({
      createTransaction,
    }),
    updateTransaction: new UpdateTransactionUseCase({
      transactionRepository,
      clock,
    }),
    deleteTransaction: new DeleteTransactionUseCase({
      transactionRepository,
    }),
  };
}
