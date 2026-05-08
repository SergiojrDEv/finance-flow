export type TransactionKind = "income" | "expense" | "investment";
export type TransactionStatus = "paid" | "pending" | "planned";
export type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "transfer";

export type ValidationErrors = Record<string, string>;

export type ValidationResult = {
  valid: boolean;
  errors: ValidationErrors;
};

export type AmountPresentation = {
  sign: "+" | "-";
  className: "positive" | "negative" | "purple";
};
