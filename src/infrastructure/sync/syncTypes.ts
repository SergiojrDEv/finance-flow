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

export type CloudSnapshotRefs = {
  accountById: Map<string, Record<string, unknown>>;
  categoryById: Map<string, Record<string, unknown>>;
  tagById: Map<string, Record<string, unknown>>;
};

export type CloudSnapshotInput = {
  accounts?: Array<Record<string, unknown>>;
  creditCards?: Array<Record<string, unknown>>;
  categories?: Array<Record<string, unknown>>;
  categoryTags?: Array<Record<string, unknown>>;
  budgets?: Array<Record<string, unknown>>;
  goals?: Array<Record<string, unknown>>;
  transactions?: Array<Record<string, unknown>>;
  legacyTransactions?: LegacyTransactionRow[];
};

export type HydratedCloudSnapshot = {
  catalog: CatalogSnapshot;
  dataMode: "v2";
  transactions: TransactionDraft[];
};

export type LegacyCloudSnapshotInput = {
  transactions?: LegacyTransactionRow[];
  settings?: Record<string, unknown> | null;
};

export type HydratedLegacyCloudSnapshot = {
  transactions: TransactionDraft[];
  hasSettings: boolean;
  settings: Record<string, unknown> | null;
  catalog: CatalogSnapshot | null;
  dataMode: "legacy";
};

export type SupabaseQueryResult<TData = unknown> = {
  data?: TData | null;
  error?: Error | MissingRelationError | null;
};

export type SupabaseTableQuery<TData = unknown> = {
  select?: (columns?: string) => { limit?: (value: number) => Promise<SupabaseQueryResult<TData>> };
  upsert?: (row: Record<string, unknown> | Record<string, unknown>[]) => Promise<SupabaseQueryResult<TData>>;
};

export type SupabaseClientLike = {
  from: (table: string) => any;
};

export type UserMetadata = {
  full_name?: string;
  cpf?: string;
  phone?: string;
  birthdate?: string;
};

export type SupabaseAuthUser = {
  id?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: UserMetadata;
};

export type UserProfileRow = {
  user_id: string;
  full_name: string;
  cpf: string;
  phone: string;
  birthdate: string | null;
  updated_at: string;
};

export type SyncServices = {
  cloudSnapshotRepository: { fetchV2: (input: { userId: string }) => Promise<CloudSnapshotInput> };
  catalogV2SyncRepository: { sync: (payload: { userId: string; catalog: CatalogSnapshot }) => Promise<V2Refs> };
  transactionV2SyncRepository: { sync: (payload: { userId: string; transactions: LocalTransaction[]; refs: V2Refs }) => Promise<unknown> };
  legacySyncRepository: {
    sync: (payload: LegacySyncPayload) => Promise<unknown>;
    fetch: (input: { userId: string }) => Promise<LegacyCloudSnapshotInput>;
  };
};

export type PullCloudSyncInput = {
  services?: SyncServices;
  userId?: string;
  supportsV2?: boolean;
  silent?: boolean;
  hasLocalTransactions?: boolean;
  currentCatalog?: CatalogSnapshot | null;
  mergeSettings?: (settings?: Record<string, unknown> | null) => Record<string, unknown>;
  hydrateCatalog?: (settings?: Record<string, unknown> | null, currentCatalog?: CatalogSnapshot | null) => CatalogSnapshot;
};

export type PullCloudSyncResult = {
  skipped: boolean;
  source: "v2" | "legacy";
  hydrated: HydratedCloudSnapshot | HydratedLegacyCloudSnapshot | null;
  shouldSyncSettingsFromCatalog: boolean;
};

export type PushCloudSyncInput = {
  services?: SyncServices;
  userId?: string;
  supportsV2?: boolean;
  catalog?: CatalogSnapshot | null;
  settings?: Record<string, unknown>;
  transactions?: LocalTransaction[];
  hydrateCatalog?: (settings?: unknown, catalog?: CatalogSnapshot | null) => CatalogSnapshot;
  parseLocalDate?: ParseLocalDate;
};

export type PushCloudSyncResult = {
  catalog: CatalogSnapshot | null;
  supportsV2: boolean;
  v2Refs: V2Refs | null;
};
