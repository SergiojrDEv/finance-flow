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

export type BaseEntity = {
  id: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TransactionEntity = BaseEntity & {
  userId: string;
  type: TransactionKind;
  description: string;
  category: string;
  subcategory?: string | null;
  account: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod | string;
  creditCardId?: string | null;
  recurrence?: string;
  recurrenceId?: string | null;
  installmentGroup?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  repeatCount?: number;
};

export type CategoryEntity = BaseEntity & {
  kind: TransactionKind;
  slug: string;
  name: string;
  color: string;
  monthlyLimit: number | null;
  isArchived: boolean;
};

export type CategoryTagEntity = BaseEntity & {
  kind: TransactionKind;
  categorySlug: string;
  slug: string;
  name: string;
  color: string;
  isArchived: boolean;
};

export type CategoryBudgetEntity = BaseEntity & {
  categorySlug: string;
  weeklyLimit: number;
  monthlyLimit: number;
};

export type GoalEntity = BaseEntity & {
  name: string;
  key: string;
  target: number;
  currentAmount: number;
  color: string;
  isArchived: boolean;
};
