import { supabase } from "./supabase";
import type { Transaction, AppSettings, Goal, CategoryBudget, RecurringTransaction } from "../types";

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
    if (error.code === "PGRST116") return null; // no row yet
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

// Merge remote transactions into local by id — remote wins for conflicts
export function mergeTransactions(local: Transaction[], remote: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  for (const t of local) map.set(t.id, t);
  for (const t of remote) map.set(t.id, t); // remote overwrites
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}
