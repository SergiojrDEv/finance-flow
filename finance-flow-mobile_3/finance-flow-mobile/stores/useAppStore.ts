import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Transaction, AppSettings, Goal, CategoryBudget, RecurringTransaction } from "../types";
import { pushToCloud, pullFromCloud, mergeTransactions } from "../lib/sync";
import { useAuthStore } from "./useAuthStore";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const s = useAppStore.getState();
    pushToCloud(userId, {
      transactions: s.transactions,
      goals: s.goals,
      settings: s.settings,
      recurringTransactions: s.recurringTransactions,
      budgets: s.budgets,
      hasOnboarded: s.hasOnboarded,
    }).catch(() => {});
  }, 2000);
}

// defaultSettings reaproveitado diretamente do src/core/state.js
const defaultSettings: AppSettings = {
  accounts: ["Carteira", "Conta corrente", "Cartao de credito", "Corretora"],
  creditCards: [
    { id: "default-card", name: "Cartao principal", closingDay: 25, dueDay: 10 },
  ],
  categories: {
    expense: [
      ["moradia", "Moradia", "#0b7285", 2200],
      ["alimentacao", "Alimentacao", "#c43d4b", 1400],
      ["transporte", "Transporte", "#f08c00", 650],
      ["saude", "Saude", "#2b8a3e", 500],
      ["lazer", "Lazer", "#7048e8", 600],
      ["educacao", "Educacao", "#1971c2", 450],
      ["outros", "Outros", "#667085", 350],
    ],
    income: [
      ["salario", "Salario", "#168a5b"],
      ["freelance", "Freelance", "#0b7285"],
      ["rendimento", "Rendimento", "#635bff"],
      ["outros", "Outras receitas", "#667085"],
    ],
    investment: [
      ["renda-fixa", "Renda fixa", "#635bff"],
      ["acoes", "Acoes", "#1971c2"],
      ["fundos", "Fundos", "#0b7285"],
      ["cripto", "Cripto", "#f08c00"],
      ["previdencia", "Previdencia", "#7048e8"],
    ],
  },
  subcategories: {
    expense: {
      alimentacao: [["mercado", "Mercado"], ["restaurante", "Restaurante"]],
      transporte: [["combustivel", "Combustivel"], ["app-mobilidade", "App e taxi"]],
    },
    income: {
      salario: [["fixo", "Salario fixo"], ["bonus", "Bonus"]],
    },
    investment: {
      "renda-fixa": [["tesouro", "Tesouro"], ["cdb", "CDB"]],
      acoes: [["dividendos", "Dividendos"], ["buy-hold", "Buy and hold"]],
    },
  },
  goals: [
    { name: "Reserva de emergencia", target: 30000, key: "renda-fixa" },
    { name: "Viagem", target: 9000, key: "fundos" },
    { name: "Aposentadoria", target: 120000, key: "previdencia" },
  ],
  budgetRules: {
    moradia: { weekly: 550, monthly: 2200 },
    alimentacao: { weekly: 350, monthly: 1400 },
    transporte: { weekly: 162.5, monthly: 650 },
    saude: { weekly: 125, monthly: 500 },
    lazer: { weekly: 150, monthly: 600 },
    educacao: { weekly: 112.5, monthly: 450 },
    outros: { weekly: 87.5, monthly: 350 },
  },
};

interface AppState {
  // Dados
  transactions: Transaction[];
  settings: AppSettings;
  goals: Goal[];
  budgets: CategoryBudget[];
  recurringTransactions: RecurringTransaction[];

  // Navegação de mês
  currentDate: string; // ISO date string

  // Sync state
  isSyncing: boolean;
  lastSyncAt: string | null;
  cloudReady: boolean;

  // Actions — transações
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // Actions — metas
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  archiveGoal: (id: string) => void;

  // Actions — orçamentos
  upsertBudget: (budget: CategoryBudget) => void;

  // Actions — recorrentes
  addRecurring: (r: RecurringTransaction) => void;
  removeRecurring: (id: string) => void;
  toggleRecurring: (id: string) => void;
  applyRecurrents: (month: string) => void; // "yyyy-mm"

  // Actions — configurações
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Actions — navegação de mês
  setCurrentDate: (date: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;

  // Onboarding
  hasOnboarded: boolean;
  completeOnboarding: () => void;

  // Actions — sync
  setSyncing: (isSyncing: boolean) => void;
  setCloudReady: (ready: boolean) => void;
  loadFromCloud: (userId: string) => Promise<void>;
  pushNow: (userId: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      transactions: [],
      settings: defaultSettings,
      goals: [],
      budgets: [],
      recurringTransactions: [],
      currentDate: new Date().toISOString().split("T")[0],
      isSyncing: false,
      lastSyncAt: null,
      cloudReady: false,
      hasOnboarded: false,

      // Transações
      addTransaction: (tx) => {
        set((s) => {
          // Auto-credit investment transactions to matching active goals
          let goals = s.goals;
          if (tx.type === "investment") {
            goals = s.goals.map((g) => {
              if (!g.isArchived && g.key === tx.category && g.currentAmount < g.target) {
                return { ...g, currentAmount: Math.min(g.target, g.currentAmount + tx.amount) };
              }
              return g;
            });
          }
          return { transactions: [tx, ...s.transactions], goals };
        });
        schedulePush();
      },

      updateTransaction: (id, data) => {
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
        schedulePush();
      },

      removeTransaction: (id) => {
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        schedulePush();
      },

      // Metas
      addGoal: (goal) => {
        set((s) => ({ goals: [...s.goals, { ...goal, id: goal.id || Date.now().toString() }] }));
        schedulePush();
      },

      updateGoal: (id, data) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
        }));
        schedulePush();
      },

      archiveGoal: (id) => {
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, isArchived: true } : g
          ),
        }));
        schedulePush();
      },

      // Orçamentos
      upsertBudget: (budget) => {
        set((s) => {
          const exists = s.budgets.find(
            (b) => b.categorySlug === budget.categorySlug
          );
          if (exists) {
            return {
              budgets: s.budgets.map((b) =>
                b.categorySlug === budget.categorySlug ? { ...b, ...budget } : b
              ),
            };
          }
          return { budgets: [...s.budgets, budget] };
        });
        schedulePush();
      },

      // Recorrentes
      addRecurring: (r) => {
        set((s) => ({ recurringTransactions: [...s.recurringTransactions, r] }));
        schedulePush();
      },

      removeRecurring: (id) => {
        set((s) => ({
          recurringTransactions: s.recurringTransactions.filter((r) => r.id !== id),
        }));
        schedulePush();
      },

      toggleRecurring: (id) => {
        set((s) => ({
          recurringTransactions: s.recurringTransactions.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        }));
        schedulePush();
      },

      applyRecurrents: (month) => {
        const { recurringTransactions, transactions } = get();
        const newTxs: Transaction[] = [];
        const updated = recurringTransactions.map((r) => {
          if (!r.isActive || r.lastAppliedMonth === month) return r;
          const day = String(r.dayOfMonth).padStart(2, "0");
          const [y, m] = month.split("-");
          newTxs.push({
            id: `rec-${r.id}-${month}`,
            type: r.type,
            amount: r.amount,
            category: r.category,
            description: r.description,
            date: `${y}-${m}-${day}`,
            account: r.account,
            paymentMethod: r.paymentMethod,
            creditCardId: r.creditCardId,
            notes: r.notes,
            status: "confirmed",
            createdAt: new Date().toISOString(),
          });
          return { ...r, lastAppliedMonth: month };
        });
        set({ recurringTransactions: updated, transactions: [...newTxs, ...transactions] });
        schedulePush();
      },

      // Configurações
      updateSettings: (newSettings) => {
        set((s) => ({
          settings: { ...s.settings, ...newSettings },
        }));
        schedulePush();
      },

      // Mês
      setCurrentDate: (date) => set({ currentDate: date }),

      prevMonth: () => {
        const d = new Date(get().currentDate);
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        set({ currentDate: d.toISOString().split("T")[0] });
      },

      nextMonth: () => {
        const d = new Date(get().currentDate);
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
        set({ currentDate: d.toISOString().split("T")[0] });
      },

      // Onboarding
      completeOnboarding: () => {
        set({ hasOnboarded: true });
        schedulePush();
      },

      // Sync
      setSyncing: (isSyncing) => set({ isSyncing }),
      setCloudReady: (cloudReady) =>
        set({ cloudReady, lastSyncAt: cloudReady ? new Date().toISOString() : null }),

      loadFromCloud: async (userId) => {
        set({ isSyncing: true });
        try {
          const remote = await pullFromCloud(userId);
          if (!remote) {
            // First login — push local data to bootstrap the cloud row
            const s = get();
            await pushToCloud(userId, {
              transactions: s.transactions,
              goals: s.goals,
              settings: s.settings,
              recurringTransactions: s.recurringTransactions,
              budgets: s.budgets,
              hasOnboarded: s.hasOnboarded,
            });
          } else {
            set((s) => ({
              transactions: mergeTransactions(s.transactions, remote.transactions),
              goals: remote.goals.length > 0 ? remote.goals : s.goals,
              settings: remote.settings ?? s.settings,
              recurringTransactions: remote.recurringTransactions.length > 0
                ? remote.recurringTransactions
                : s.recurringTransactions,
              budgets: remote.budgets.length > 0 ? remote.budgets : s.budgets,
              hasOnboarded: remote.hasOnboarded || s.hasOnboarded,
            }));
          }
          set({ cloudReady: true, lastSyncAt: new Date().toISOString() });
        } catch {
          // Sync failed silently — local data still works
        } finally {
          set({ isSyncing: false });
        }
      },

      pushNow: async (userId) => {
        set({ isSyncing: true });
        try {
          const s = get();
          await pushToCloud(userId, {
            transactions: s.transactions,
            goals: s.goals,
            settings: s.settings,
            recurringTransactions: s.recurringTransactions,
            budgets: s.budgets,
            hasOnboarded: s.hasOnboarded,
          });
          set({ cloudReady: true, lastSyncAt: new Date().toISOString() });
        } catch {
          // ignore
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "finance-flow-state-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Seletores utilitários
export const useCurrentMonthTransactions = () => {
  const { transactions, currentDate } = useAppStore();
  const [year, month] = currentDate.split("-").map(Number);
  return transactions.filter((t) => {
    const [ty, tm] = t.date.split("-").map(Number);
    return ty === year && tm === month;
  });
};
