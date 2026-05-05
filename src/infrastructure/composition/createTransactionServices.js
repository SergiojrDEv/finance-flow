import { CreateTransactionUseCase } from "../../application/transactions/CreateTransactionUseCase.js";
import { LocalTransactionRepository } from "../transactions/LocalTransactionRepository.js";

export function createTransactionServices({
  readTransactions,
  writeTransactions,
  createId,
  clock,
} = {}) {
  const transactionRepository = new LocalTransactionRepository({
    readTransactions,
    writeTransactions,
    createId,
  });

  return {
    transactionRepository,
    createTransaction: new CreateTransactionUseCase({
      transactionRepository,
      clock,
    }),
  };
}
