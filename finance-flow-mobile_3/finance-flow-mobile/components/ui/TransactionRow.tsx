import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Trash2, CreditCard } from "lucide-react-native";
import type { Transaction } from "../../types";
import { brl, CatIcon, CAT_LABELS, CAT_COLORS, fintechTheme } from "../ui";
import { useAppStore } from "../../stores/useAppStore";

const PT_MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${PT_MONTHS_SHORT[m - 1]}`;
}

const TC = fintechTheme.colors;

const PM_LABELS: Record<string, string> = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  transfer: "Transfer.",
};

function typeColor(type: string) {
  if (type === "income") return TC.income;
  if (type === "investment") return TC.invest;
  return TC.expense;
}

interface Props {
  tx: Transaction;
  onDelete?: (id: string) => void;
  onPress?: (tx: Transaction) => void;
}

export function TransactionRow({ tx, onDelete, onPress }: Props) {
  const { settings } = useAppStore();
  const label = CAT_LABELS[tx.category] || tx.category;

  const cardName = tx.creditCardId
    ? settings.creditCards.find((c) => c.id === tx.creditCardId)?.name
    : undefined;

  function confirmDelete() {
    Alert.alert(
      "Remover lançamento",
      "Tem certeza que deseja remover este lançamento?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => onDelete?.(tx.id) },
      ]
    );
  }

  const metaParts = [label, fmtDate(tx.date)];
  if (tx.account) metaParts.push(tx.account);

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress?.(tx)} activeOpacity={0.7}>
      <CatIcon slug={tx.category} size={42} />
      <View style={styles.info}>
        <Text style={styles.desc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.meta} numberOfLines={1}>{metaParts.join(" · ")}</Text>
        <View style={styles.badges}>
          {tx.status === "pending" && (
            <View style={[styles.badge, { backgroundColor: TC.warning + "18" }]}>
              <Text style={[styles.badgeText, { color: TC.warning }]}>Pendente</Text>
            </View>
          )}
          {tx.paymentMethod === "credit" && (
            <View style={[styles.badge, { backgroundColor: TC.invest + "14", flexDirection: "row", gap: 3, alignItems: "center" }]}>
              <CreditCard size={9} color={TC.invest} strokeWidth={2.5} />
              <Text style={[styles.badgeText, { color: TC.invest }]}>
                {cardName ?? PM_LABELS.credit}
              </Text>
            </View>
          )}
          {tx.paymentMethod && tx.paymentMethod !== "credit" && tx.type === "expense" && (
            <View style={[styles.badge, { backgroundColor: TC.muted + "14" }]}>
              <Text style={[styles.badgeText, { color: TC.muted }]}>
                {PM_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: typeColor(tx.type) }]}>
        {tx.type === "income" ? "+" : tx.type === "investment" ? "↑" : "-"}
        {brl(tx.amount)}
      </Text>
      {onDelete && (
        <TouchableOpacity onPress={confirmDelete} style={styles.del}>
          <Trash2 size={15} color="#cbd5e1" strokeWidth={1.8} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: TC.line,
    backgroundColor: TC.panel,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  desc: { fontSize: 14, fontWeight: "600", color: TC.text },
  meta: { fontSize: 12, color: TC.muted },
  badges: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 2 },
  badge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  amount: { fontSize: 14, fontWeight: "700", flexShrink: 0 },
  del: { padding: 4, marginLeft: 4 },
});
