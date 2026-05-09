import { fail, ok } from "../shared/result.js";

function pickDefaultAccount(settings = {}) {
  const accounts = Array.isArray(settings.accounts) ? settings.accounts : [];
  return accounts[0] || "Conta corrente";
}

function pickDefaultCategory(type) {
  if (type === "income") return "salario";
  if (type === "investment") return "renda-fixa";
  return "outros";
}

export function buildImportedTransactionDraft({
  importedTransaction,
  settings = {},
  userId = "local-user",
} = {}) {
  if (!importedTransaction?.id) {
    return fail({ importedTransaction: "Transacao importada nao encontrada." });
  }

  const type = importedTransaction.type === "income" || importedTransaction.type === "investment"
    ? importedTransaction.type
    : "expense";
  const draft = {
    userId,
    type,
    description: importedTransaction.description,
    category: pickDefaultCategory(type),
    account: pickDefaultAccount(settings),
    amount: importedTransaction.amount,
    date: importedTransaction.date,
    status: "paid",
    origin: "open_finance",
    importedTransactionId: importedTransaction.id,
  };

  if (type === "expense") {
    draft.subcategory = "";
    draft.paymentMethod = "pix";
    draft.dueDate = importedTransaction.date;
    draft.recurrence = "none";
    draft.repeatCount = 1;
  }

  return ok(draft);
}
