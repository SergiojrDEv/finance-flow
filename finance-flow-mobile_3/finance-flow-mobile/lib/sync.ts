import { supabase } from "./supabase";
import type {
  AppSettings,
  CategoryBudget,
  Goal,
  RecurringTransaction,
  Transaction,
} from "../types";

export interface CloudPayload {
  transactions: Transaction[];
  goals: Goal[];
  settings: AppSettings | null;
  recurringTransactions: RecurringTransaction[];
  budgets: CategoryBudget[];
  hasOnboarded: boolean;
}

export async function pushToCloud(userId: string, payload: CloudPayload): Promise<void> {
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      transactions: payload.transactions,
      goals: payload.goals,
      settings: payload.settings,
      recurring_transactions: payload.recurringTransactions,
      budgets: payload.budgets,
      has_onboarded: payload.hasOnboarded,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function pullFromCloud(userId: string): Promise<CloudPayload | null> {
  const { data, error } = await supabase
    .from("user_data")
    .select("transactions, goals, settings, recurring_transactions, budgets, has_onboarded")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    transactions: (data.transactions as Transaction[]) ?? [],
    goals: (data.goals as Goal[]) ?? [],
    settings: (data.settings as AppSettings | null) ?? null,
    recurringTransactions: (data.recurring_transactions as RecurringTransaction[]) ?? [],
    budgets: (data.budgets as CategoryBudget[]) ?? [],
    hasOnboarded: data.has_onboarded ?? false,
  };
}

export async function pullLegacyUserData(userId: string): Promise<CloudPayload | null> {
  const [
    categoriesRes,
    accountsRes,
    cardsRes,
    goalsRes,
    budgetsRes,
    recurringRes,
    v2Res,
    legacyRes,
    settingsRes,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, kind, name, slug, color, monthly_limit, is_archived")
      .eq("user_id", userId),
    supabase
      .from("accounts")
      .select("id, name, kind, color, institution, is_archived")
      .eq("user_id", userId),
    supabase
      .from("credit_cards")
      .select("id, name, color, closing_day, due_day, credit_limit, is_archived")
      .eq("user_id", userId),
    supabase
      .from("goals")
      .select("id, name, target_amount, current_amount, linked_category_id, color, is_archived")
      .eq("user_id", userId),
    supabase
      .from("budgets")
      .select("id, category_id, period_kind, amount")
      .eq("user_id", userId),
    supabase
      .from("recurring_rules")
      .select("id, title, transaction_kind, amount, category_id, account_id, credit_card_id, payment_method, starts_on, status, metadata, created_at")
      .eq("user_id", userId),
    supabase
      .from("transactions_v2")
      .select("id, transaction_kind, status, description, notes, amount, transaction_date, due_date, category_id, category_tag_id, account_id, credit_card_id, payment_method, created_at, updated_at")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(1500),
    supabase
      .from("transactions")
      .select("id, date, descricao, cat, subcat, type, val, account, created_at, status, due_date, payment_method, credit_card_id, notes, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("finance_settings")
      .select("settings")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const criticalErrors = [
    categoriesRes.error,
    accountsRes.error,
    cardsRes.error,
    goalsRes.error,
    budgetsRes.error,
    recurringRes.error,
  ].filter(Boolean);
  if (criticalErrors.length > 0) throw criticalErrors[0];

  const categories = categoriesRes.data ?? [];
  const accounts = accountsRes.data ?? [];
  const cards = cardsRes.data ?? [];
  const goalRows = goalsRes.data ?? [];
  const budgetRows = budgetsRes.data ?? [];
  const recurringRows = recurringRes.data ?? [];
  const v2Rows = v2Res.error ? [] : (v2Res.data ?? []);
  const legacyRows = legacyRes.error ? [] : (legacyRes.data ?? []);
  const storedSettings = settingsRes.error
    ? null
    : (settingsRes.data?.settings as AppSettings | null);

  const categoryById = new Map(categories.map((category: any) => [category.id, category]));
  const accountById = new Map(accounts.map((account: any) => [account.id, account]));

  const transactions = [
    ...v2Rows.map((row: any) => mapV2Transaction(row, categoryById, accountById)),
    ...legacyRows.map((row: any) => mapLegacyTransaction(row)),
  ].filter((tx): tx is Transaction => Boolean(tx));

  const payload: CloudPayload = {
    transactions: mergeTransactions([], transactions),
    goals: goalRows.map((goal: any) => mapGoal(goal, categoryById)),
    settings: buildSettings(storedSettings, categories, accounts, cards),
    recurringTransactions: recurringRows.map((rule: any) =>
      mapRecurring(rule, categoryById, accountById)
    ),
    budgets: mapBudgets(budgetRows, categoryById),
    hasOnboarded: true,
  };

  const hasData =
    payload.transactions.length > 0 ||
    payload.goals.length > 0 ||
    payload.recurringTransactions.length > 0 ||
    payload.budgets.length > 0 ||
    Boolean(payload.settings);

  return hasData ? payload : null;
}

export function shouldBootstrapFromLegacy(payload: CloudPayload | null): boolean {
  if (!payload) return true;
  return (
    payload.transactions.length === 0 &&
    payload.goals.length === 0 &&
    payload.recurringTransactions.length === 0 &&
    payload.budgets.length === 0
  );
}

export function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  for (const tx of local) map.set(tx.id, tx);
  for (const tx of remote) map.set(tx.id, tx);
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeKind(kind: string | null | undefined): Transaction["type"] {
  if (kind === "income" || kind === "receita") return "income";
  if (kind === "investment" || kind === "investimento") return "investment";
  return "expense";
}

function normalizeStatus(status: string | null | undefined): Transaction["status"] {
  if (status === "pending" || status === "previsto") return "pending";
  if (status === "scheduled" || status === "agendado") return "scheduled";
  return "confirmed";
}

function normalizePaymentMethod(value: string | null | undefined): Transaction["paymentMethod"] {
  if (value === "credit" || value === "credito") return "credit";
  if (value === "debit" || value === "debito") return "debit";
  if (value === "cash" || value === "dinheiro") return "cash";
  if (value === "transfer" || value === "transferencia") return "transfer";
  return "pix";
}

function mapV2Transaction(
  row: any,
  categoryById: Map<string, any>,
  accountById: Map<string, any>
): Transaction | null {
  if (!row?.id || row.amount == null) return null;
  const category = row.category_id ? categoryById.get(row.category_id) : null;
  const account = row.account_id ? accountById.get(row.account_id) : null;

  return {
    id: String(row.id),
    type: normalizeKind(row.transaction_kind),
    amount: Math.abs(Number(row.amount) || 0),
    category: category?.slug ?? "outros",
    description: row.description ?? "Lancamento",
    date: row.transaction_date ?? new Date().toISOString().slice(0, 10),
    account: account?.name,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    creditCardId: row.credit_card_id ? String(row.credit_card_id) : undefined,
    notes: row.notes ?? undefined,
    status: normalizeStatus(row.status),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapLegacyTransaction(row: any): Transaction | null {
  if (!row?.id || row.val == null) return null;

  return {
    id: String(row.id),
    type: normalizeKind(row.type),
    amount: Math.abs(Number(row.val) || 0),
    category: row.cat ?? row.subcat ?? "outros",
    subcategory: row.subcat ?? undefined,
    description: row.descricao ?? "Lancamento",
    date: row.date ?? new Date().toISOString().slice(0, 10),
    account: row.account ?? undefined,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    creditCardId: row.credit_card_id ? String(row.credit_card_id) : undefined,
    notes: row.notes ?? undefined,
    status: normalizeStatus(row.status),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapGoal(row: any, categoryById: Map<string, any>): Goal {
  const category = row.linked_category_id ? categoryById.get(row.linked_category_id) : null;
  return {
    id: String(row.id),
    name: row.name ?? "Meta",
    key: category?.slug ?? "renda-fixa",
    target: Number(row.target_amount) || 0,
    currentAmount: Number(row.current_amount) || 0,
    color: row.color ?? category?.color,
    isArchived: Boolean(row.is_archived),
  };
}

function mapRecurring(
  row: any,
  categoryById: Map<string, any>,
  accountById: Map<string, any>
): RecurringTransaction {
  const category = row.category_id ? categoryById.get(row.category_id) : null;
  const account = row.account_id ? accountById.get(row.account_id) : null;
  const day = row.starts_on ? Number(String(row.starts_on).slice(8, 10)) : 1;

  return {
    id: String(row.id),
    type: normalizeKind(row.transaction_kind),
    amount: Math.abs(Number(row.amount) || 0),
    category: category?.slug ?? "outros",
    description: row.title ?? "Recorrente",
    account: account?.name,
    paymentMethod: normalizePaymentMethod(row.payment_method),
    creditCardId: row.credit_card_id ? String(row.credit_card_id) : undefined,
    notes: row.metadata?.notes,
    dayOfMonth: Math.min(28, Math.max(1, day || 1)),
    isActive: row.status === "active",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapBudgets(rows: any[], categoryById: Map<string, any>): CategoryBudget[] {
  const byCategory = new Map<string, CategoryBudget>();
  for (const row of rows) {
    const category = row.category_id ? categoryById.get(row.category_id) : null;
    const slug = category?.slug;
    if (!slug) continue;

    const current = byCategory.get(slug) ?? {
      id: String(row.id),
      categorySlug: slug,
      weeklyLimit: 0,
      monthlyLimit: 0,
    };

    if (row.period_kind === "weekly" || row.period_kind === "semana") {
      current.weeklyLimit = Number(row.amount) || 0;
    } else {
      current.monthlyLimit = Number(row.amount) || 0;
    }

    byCategory.set(slug, current);
  }

  return Array.from(byCategory.values());
}

function buildSettings(
  storedSettings: AppSettings | null,
  categories: any[],
  accounts: any[],
  cards: any[]
): AppSettings | null {
  const base = storedSettings ?? {
    accounts: [],
    creditCards: [],
    categories: { expense: [], income: [], investment: [] },
    subcategories: { expense: {}, income: {}, investment: {} },
    goals: [],
    budgetRules: {},
  };
  const activeCategories = categories.filter((category) => !category.is_archived);
  const expense = activeCategories
    .filter((category) => category.kind === "expense" || category.kind === "despesa")
    .map((category) => [
      category.slug,
      category.name,
      category.color,
      Number(category.monthly_limit) || 0,
    ] as [string, string, string, number]);
  const income = activeCategories
    .filter((category) => category.kind === "income" || category.kind === "receita")
    .map((category) => [category.slug, category.name, category.color] as [string, string, string]);
  const investment = activeCategories
    .filter((category) => category.kind === "investment" || category.kind === "investimento")
    .map((category) => [category.slug, category.name, category.color] as [string, string, string]);

  return {
    ...base,
    accounts: accounts.filter((account) => !account.is_archived).map((account) => account.name),
    creditCards: cards
      .filter((card) => !card.is_archived)
      .map((card) => ({
        id: String(card.id),
        name: card.name,
        closingDay: Number(card.closing_day) || 1,
        dueDay: Number(card.due_day) || 1,
      })),
    categories: {
      expense: expense.length > 0 ? expense : base.categories.expense,
      income: income.length > 0 ? income : base.categories.income,
      investment: investment.length > 0 ? investment : base.categories.investment,
    },
  };
}
