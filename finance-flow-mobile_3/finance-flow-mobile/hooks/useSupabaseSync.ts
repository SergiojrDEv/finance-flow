import { useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../stores/useAppStore";
import { useAuthStore } from "../stores/useAuthStore";
import type { Transaction } from "../types";

// Hook de sincronização com Supabase
// Reutiliza a mesma lógica do CloudPullSyncService/CloudPushSyncService do projeto web

export function useSupabaseSync() {
  const { user } = useAuthStore();
  const { transactions, setSyncing, setCloudReady } = useAppStore();

  const pull = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(500);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Transaction[] = data.map((row: any) => ({
          id: row.id,
          type: row.type,
          amount: Number(row.amount),
          description: row.description,
          category: row.category,
          subcategory: row.subcategory,
          date: row.date,
          account: row.account,
          paymentMethod: row.payment_method,
          creditCardId: row.credit_card_id,
          notes: row.notes,
          status: row.status || "confirmed",
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // Merge com dados locais (prioridade: mais recente)
        useAppStore.setState({ transactions: merged(mapped, transactions) });
      }

      setCloudReady(true);
    } catch (err) {
      console.error("[useSupabaseSync] pull error:", err);
      setCloudReady(false);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const push = useCallback(async (tx: Transaction) => {
    if (!user) return;
    const { error } = await supabase.from("transactions").upsert({
      id: tx.id,
      user_id: user.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      subcategory: tx.subcategory,
      date: tx.date,
      account: tx.account,
      payment_method: tx.paymentMethod,
      credit_card_id: tx.creditCardId,
      notes: tx.notes,
      status: tx.status || "confirmed",
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[useSupabaseSync] push error:", error);
  }, [user]);

  // Pull ao iniciar sessão
  useEffect(() => {
    if (user) pull();
  }, [user]);

  return { pull, push };
}

// Merge de listas: preferência por id único, mais recente
function merged(remote: Transaction[], local: Transaction[]): Transaction[] {
  const map = new Map<string, Transaction>();
  local.forEach((t) => map.set(t.id, t));
  remote.forEach((t) => {
    const existing = map.get(t.id);
    if (!existing || (t.updatedAt && (!existing.updatedAt || t.updatedAt > existing.updatedAt))) {
      map.set(t.id, t);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}
