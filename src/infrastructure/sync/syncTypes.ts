import type { TransactionDraft, TransactionEntity, TransactionKind, TransactionStatus } from "../../application/shared/applicationTypes.js";

export type MissingRelationError = {
  message?: string;
  code?: string;
};

export type AccountKind = "credit_card" | "investment" | "wallet" | "savings" | "checking";

export type Clock = () => Date;

export type ParseLocalDate = (value?: string) => Date;

export type LegacyTransactionRow = {
  id?: string | null;
  user_id?: string;
  date?: string;
  descricao?: string;
  description?: string;
  cat?: string;
  category?: string;
  subcat?: string | null;
  subcategory?: string | null;
  type?: TransactionKind | string;
  val?: number | string;
  amount?: number | string;
  account?: string;
  status?: TransactionStatus | string;
  due_date?: string | null;
  payment_method?: string | null;
  credit_card_id?: string | null;
  recurrence_id?: string | null;
  installment_group?: string | null;
  installment_number?: number | string | null;
  installment_total?: number | string | null;
  year?: number | null;
  month?: number | null;
  created_at?: string | null;
};

export type LocalTransaction = TransactionEntity | TransactionDraft;

export type LegacySyncPayload = {
  userId: string;
  rows: LegacyTransactionRow[];
  settings: Record<string, unknown>;
  localIds: Array<string | null | undefined>;
};

export type CatalogSnapshot = {
  accounts?: unknown[];
  categories?: unknown[];
  tags?: unknown[];
  creditCards?: unknown[];
  budgets?: unknown[];
  goals?: unknown[];
  [key: string]: unknown;
};

export type V2Refs = Record<string, unknown>;
