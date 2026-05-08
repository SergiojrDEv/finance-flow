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

export type CategoryBudgetDraft = Partial<CategoryBudgetEntity>;

export type CategoryDraft = Partial<CategoryEntity> & {
  kind?: TransactionKind | string;
  monthlyLimit?: number | string | null;
};

export type CategoryTagDraft = Partial<CategoryTagEntity> & {
  kind?: TransactionKind | string;
};

export type GoalDraft = Partial<GoalEntity> & {
  target?: number | string;
  currentAmount?: number | string;
};

export type TransactionDraft = Partial<TransactionEntity> & {
  type?: TransactionKind | string;
  amount?: number | string;
  repeatCount?: number | string;
  installmentNumber?: number | string | null;
  installmentTotal?: number | string | null;
};

export type FinancialHealth = {
  score: number;
  status: "empty" | "missing-income" | "negative" | "healthy" | "attention";
  copy: string;
};

export type FinancialSummary = {
  totals: {
    income: number;
    expenses: number;
    investments: number;
    available: number;
  };
  counts: {
    transactions: number;
    income: number;
    expenseCategories: number;
    investments: number;
  };
  rates: {
    investmentRate: number;
    commitmentRate: number;
  };
  health: FinancialHealth;
};

export type CategoryTuple = [key: string, label: string, color: string];

export type CategoryBreakdownRow = {
  key: string;
  label: string;
  color: string;
  value: number;
  width: number;
};

export type CashflowSeriesPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  investment: number;
  free: number;
};

export type TransactionHighlights = {
  count: number;
  status: {
    paid: number;
    pending: number;
  };
  payments: {
    pix: number;
    credit: number;
  };
  totals: {
    income: number;
    outflow: number;
  };
};

export type AuthUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  [key: string]: unknown;
};

export type SignupProfile = {
  fullName: string;
  cpf: string;
  phone: string;
  birthdate: string;
  email: string;
  password: string;
};

export type AuthPlan = {
  action: "active-session" | "password-recovery" | "sign-out-unconfirmed" | "ignore";
  authGateMessage: string;
  currentUser: AuthUser | null;
  isPasswordRecovery: boolean;
  shouldPull: boolean;
  shouldSaveProfile: boolean;
  shouldSignOut: boolean;
  view: "" | "update-password";
};

export type AuthClient = {
  signInWithPassword(payload: { email?: string; password?: string }): Promise<{ data?: { user?: AuthUser | null }; error?: { message: string } | null }>;
  signUp(payload: {
    email: string;
    password: string;
    options?: {
      emailRedirectTo?: string;
      data?: Record<string, unknown>;
    };
  }): Promise<{ data?: unknown; error?: { message: string } | null }>;
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ data?: unknown; error?: { message: string } | null }>;
  updateUser(payload: { password?: string }): Promise<{ data?: unknown; error?: { message: string } | null }>;
  signOut?: () => Promise<unknown>;
};

export type CloudStatusInput = {
  forcedText?: string;
  cloudReady?: boolean;
  isSyncing?: boolean;
  userEmail?: string;
};

export type CloudPullStartPlan = {
  action: "confirm-replace" | "sync-local-first" | "pull";
  shouldAskConfirmation: boolean;
  shouldRenderStatus: boolean;
  statusText: string;
  shouldScheduleAutoSync: boolean;
  shouldContinue: boolean;
};

export type CloudPullConfirmationPlan = {
  action: "pull" | "cancel";
  shouldContinue: boolean;
  shouldRenderStatus: boolean;
  statusText: string;
};

export type CloudPullCompletionPlan = {
  action: "skipped" | "applied";
  shouldSave: boolean;
  shouldUpdateOptions: boolean;
  shouldRenderAll: boolean;
  shouldRenderStatus: boolean;
  shouldNotify: boolean;
};

export type CloudSyncState = {
  transactions?: TransactionDraft[];
  lastLocalChangeAt?: string | null;
  lastCloudSyncAt?: string | null;
  isSyncing?: boolean;
  pendingCloudSync?: boolean;
  settings?: unknown;
  catalog?: unknown;
  dataMode?: string;
};

export type CloudSyncStartPlan = {
  shouldStart: boolean;
  shouldMarkPending: boolean;
};

export type CloudSyncCompletionPlan = {
  pendingCloudSync: boolean;
  lastCloudSyncAt: string;
  shouldRunAgain: boolean;
};

export type TransactionV2Row = {
  id: string;
  user_id?: string;
  transaction_kind: TransactionKind;
  status: string;
  description?: string;
  amount: number;
  transaction_date?: string;
  due_date?: string;
  category_id: string | null;
  category_tag_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  payment_method: string;
  recurring_rule_id: string | null;
  installment_group_id: string | null;
  installment_number: number | string | null;
  installment_total: number | string | null;
  created_at: string;
  updated_at: string;
};

export type CloudSnapshot = Record<string, unknown>;

export type SyncResult = {
  [key: string]: unknown;
};
