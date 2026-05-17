// Tipos centrais do Finance Flow Mobile
// Baseados nos domain models do projeto web

export type TransactionType = "expense" | "income" | "investment";
export type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "transfer";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  account?: string;
  paymentMethod?: PaymentMethod;
  creditCardId?: string;
  notes?: string;
  status?: "confirmed" | "pending" | "scheduled";
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  kind: TransactionType;
  name: string;
  slug: string;
  color: string;
  monthlyLimit?: number;
  isArchived?: boolean;
}

export interface CategoryBudget {
  id?: string;
  categorySlug: string;
  weeklyLimit: number;
  monthlyLimit: number;
}

export interface Goal {
  id?: string;
  name: string;
  key: string; // categoria de investimento associada
  target: number;
  currentAmount: number;
  color?: string;
  isArchived?: boolean;
}

export interface Account {
  id: string;
  name: string;
  kind: "cash" | "checking" | "savings" | "investment" | "credit_card" | "wallet";
  color: string;
  institution?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  color: string;
  closingDay: number;
  dueDay: number;
  creditLimit?: number;
}

// Estado do defaultSettings (mapeado do core/state.js)
export interface AppSettings {
  accounts: string[];
  creditCards: { id: string; name: string; closingDay: number; dueDay: number }[];
  categories: {
    expense: [string, string, string, number][];
    income: [string, string, string][];
    investment: [string, string, string][];
  };
  subcategories: Record<string, Record<string, [string, string][]>>;
  goals: { name: string; target: number; key: string }[];
  budgetRules: Record<string, { weekly: number; monthly: number }>;
}

// Resultado do buildFinancialSummary
export interface FinancialSummary {
  totals: {
    income: number;
    expenses: number;
    investments: number;
    available: number;
  };
  counts: {
    income: number;
    expenseCategories: number;
  };
  rates: {
    investmentRate: number;
    commitmentRate: number;
  };
  health: {
    score: number;
    status: string;
    copy: string;
  };
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  account?: string;
  paymentMethod?: PaymentMethod;
  creditCardId?: string;
  notes?: string;
  dayOfMonth: number; // 1–28
  isActive: boolean;
  createdAt: string;
  lastAppliedMonth?: string; // "yyyy-mm"
}

// Meses para navegação
export type MonthKey = `${number}-${string}`;
