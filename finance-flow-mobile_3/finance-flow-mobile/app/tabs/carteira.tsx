import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, X, Send, ArrowDownLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore, useCurrentMonthTransactions } from "../../stores/useAppStore";
import { brl, MonthNav, fintechTheme } from "../../components/ui";
import { TransactionRow } from "../../components/ui/TransactionRow";
import type { Transaction, TransactionType } from "../../types";

type Filter = TransactionType | "all";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "expense", label: "Despesas" },
  { key: "income", label: "Receitas" },
  { key: "investment", label: "Investimentos" },
];

function groupByDate(txs: any[]) {
  const map = new Map<string, any[]>();
  for (const tx of txs) {
    const day = tx.date.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(tx);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function CarteiraScreen() {
  const router = useRouter();
  const { currentDate, prevMonth, nextMonth, removeTransaction, settings } = useAppStore();
  const txList = useCurrentMonthTransactions();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const income = useMemo(
    () => txList.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [txList]
  );
  const expense = useMemo(
    () => txList.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [txList]
  );
  const investment = useMemo(
    () => txList.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0),
    [txList]
  );
  const outflow = expense + investment;
  const available = income - outflow;

  const grouped = useMemo(() => {
    let list = filter === "all" ? txList : txList.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return groupByDate(list);
  }, [txList, filter, search]);

  const totalFiltered = grouped.reduce((s, [, txs]) => s + txs.length, 0);
  const accountName = settings.accounts?.[0] || "Conta principal";

  // Per-account balance for the current month
  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of settings.accounts) map[acc] = 0;
    for (const t of txList) {
      const acc = t.account || settings.accounts[0];
      if (!acc) continue;
      if (!map[acc]) map[acc] = 0;
      if (t.type === "income") map[acc] += t.amount;
      else map[acc] -= t.amount;
    }
    return Object.entries(map).filter(([, v]) => v !== 0 || settings.accounts.includes(""));
  }, [txList, settings.accounts]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroKicker}>Carteira</Text>
              <Text style={styles.heroTitle}>Extrato do mês</Text>
            </View>
            <View style={styles.heroRight}>
              <MonthNav currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} light />
            </View>
          </View>

          {/* Totais */}
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Saldo do mês</Text>
              <Text style={[styles.totalValue, available < 0 && { color: "#ffd6dc" }]}>
                {brl(available)}
              </Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={[styles.totalLabel, { color: C.income + "cc" }]}>Entradas</Text>
              <Text style={[styles.totalValue, { color: C.income }]}>{brl(income)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={[styles.totalLabel, { color: C.expense + "cc" }]}>Saídas</Text>
              <Text style={[styles.totalValue, { color: C.expense }]}>{brl(outflow)}</Text>
            </View>
          </View>
        </View>

        {/* ── ACCOUNT CARD ── */}
        <View style={styles.cardWrap}>
          <View style={styles.accountCard}>
            {/* Brilho decorativo */}
            <View style={styles.cardGlow} />

            <View style={styles.cardTop}>
              <View style={styles.cardBrand}>
                <View style={styles.cardBrandMark}>
                  <Text style={styles.cardBrandF}>F</Text>
                </View>
                <View>
                  <Text style={styles.cardBrandName}>Finance Flow</Text>
                  <Text style={styles.cardBrandSub}>{accountName}</Text>
                </View>
              </View>
              {/* Chip */}
              <View style={styles.chip}>
                <View style={styles.chipH} />
                <View style={styles.chipV} />
              </View>
            </View>

            <View style={styles.cardMid}>
              <Text style={styles.cardBalLabel}>SALDO DISPONÍVEL</Text>
              <Text style={[styles.cardBal, available < 0 && { color: "#ffd6dc" }]}>
                {brl(available)}
              </Text>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardBtn}
                  onPress={() => router.push("/modal/lancamento?type=income")}
                >
                  <ArrowDownLeft size={14} color={C.brand} strokeWidth={2.5} />
                  <Text style={styles.cardBtnText}>Receber</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardBtn}
                  onPress={() => router.push("/modal/lancamento?type=expense")}
                >
                  <Send size={14} color={C.brand} strokeWidth={2.5} />
                  <Text style={styles.cardBtnText}>Enviar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardCount}>
                {txList.length} lançamento{txList.length !== 1 ? "s" : ""} no mês
              </Text>
            </View>
          </View>
        </View>

        {/* ── SALDO POR CONTA ── */}
        {accountBalances.length > 1 && (
          <View style={styles.accountsSection}>
            <Text style={styles.accountsSlab}>Saldo por conta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
              {accountBalances.map(([acc, bal]) => (
                <View key={acc} style={styles.accCard}>
                  <View style={styles.accInitial}>
                    <Text style={styles.accInitialText}>{acc.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.accName} numberOfLines={1}>{acc}</Text>
                  <Text style={[styles.accBal, { color: bal >= 0 ? C.income : C.expense }]}>
                    {bal >= 0 ? "+" : ""}{brl(bal)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── FILTROS + BUSCA ── */}
        <View style={styles.controls}>
          <View style={styles.searchRow}>
            <Search size={16} color={C.subtle} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar lançamentos..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={C.subtle}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color={C.subtle} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              >
                <Text
                  style={[styles.filterText, filter === f.key && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── LISTA AGRUPADA ── */}
        <View style={styles.listWrap}>
          {grouped.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>
                {search ? "Nenhum resultado" : "Sem lançamentos"}
              </Text>
              <Text style={styles.emptyCopy}>
                {search
                  ? "Tente buscar por outro termo."
                  : "Toque em + para adicionar o primeiro lançamento."}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => router.push("/modal/lancamento")}
                >
                  <Text style={styles.emptyActionText}>+ Adicionar lançamento</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.countLabel}>{totalFiltered} lançamento{totalFiltered !== 1 ? "s" : ""}</Text>
              {grouped.map(([day, txs]) => (
                <View key={day}>
                  {/* Cabeçalho do dia */}
                  <View style={styles.dayHeader}>
                    <View style={styles.dayDot} />
                    <Text style={styles.dayLabel}>{formatDayLabel(day)}</Text>
                    <View style={styles.dayLine} />
                    <Text style={styles.daySum}>
                      {brl(
                        txs.reduce(
                          (s: number, t: any) =>
                            t.type === "income" ? s + t.amount : s - t.amount,
                          0
                        )
                      )}
                    </Text>
                  </View>
                  {/* Lançamentos do dia */}
                  <View style={styles.dayCard}>
                    {txs.map((tx: any) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onDelete={removeTransaction}
                        onPress={(t) => router.push(`/modal/editar-lancamento?id=${t.id}`)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* FAB dourado */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/modal/lancamento")}
        accessibilityLabel="Novo lançamento"
      >
        <Plus size={22} color={C.brand} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.panelAlt },

  // Hero
  hero: {
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroKicker: {
    color: "rgba(255,255,255,.5)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },
  heroRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  totalsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: R.md,
    padding: 14,
    gap: 0,
  },
  totalItem: { flex: 1, alignItems: "center", gap: 4 },
  totalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,.6)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalValue: { fontSize: 14, fontWeight: "800", color: "#fff" },
  totalDivider: { width: 1, backgroundColor: "rgba(255,255,255,.15)" },

  // Account card
  cardWrap: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 4,
  },
  accountCard: {
    backgroundColor: C.brand2,
    borderRadius: R.lg,
    padding: 20,
    gap: 18,
    overflow: "hidden",
    ...S.lift,
  },
  cardGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(244,183,64,.06)",
    top: -60,
    right: -60,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardBrandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBrandF: { fontSize: 14, fontWeight: "900", color: C.brand },
  cardBrandName: { fontSize: 13, fontWeight: "800", color: "#fff" },
  cardBrandSub: { fontSize: 10, color: "rgba(255,255,255,.45)", marginTop: 1 },
  chip: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: C.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  chipH: {
    position: "absolute",
    height: 1.5,
    left: 4,
    right: 4,
    backgroundColor: C.brand + "88",
    top: "50%",
  },
  chipV: {
    position: "absolute",
    width: 1.5,
    top: 4,
    bottom: 4,
    backgroundColor: C.brand + "88",
    left: "50%",
  },
  cardMid: { gap: 4 },
  cardBalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,.5)",
    letterSpacing: 0.6,
  },
  cardBal: { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardActions: { flexDirection: "row", gap: 8 },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.gold,
    borderRadius: R.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cardBtnText: { fontSize: 12, fontWeight: "800", color: C.brand },
  cardCount: { fontSize: 11, color: "rgba(255,255,255,.4)" },

  // Account balances
  accountsSection: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  accountsSlab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  accountsScroll: { marginHorizontal: -4 },
  accCard: {
    backgroundColor: C.panel,
    borderRadius: R.md,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 110,
    gap: 6,
    ...S.soft,
  },
  accInitial: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.brand + "14",
    alignItems: "center", justifyContent: "center",
  },
  accInitialText: { fontSize: 13, fontWeight: "800", color: C.brand },
  accName: { fontSize: 12, fontWeight: "600", color: C.muted },
  accBal: { fontSize: 14, fontWeight: "800" },

  // Controls
  controls: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.panel,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    height: 44,
    ...S.soft,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  filtersScroll: { marginHorizontal: -2 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: R.pill,
    marginRight: 8,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
  filterBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  filterText: { fontSize: 13, color: C.muted, fontWeight: "700" },
  filterTextActive: { color: "#fff" },

  // List
  listWrap: { paddingHorizontal: 16, paddingTop: 4 },
  countLabel: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 12,
    marginTop: 4,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.brand,
    opacity: 0.4,
  },
  dayLabel: { fontSize: 12, fontWeight: "700", color: C.muted },
  dayLine: { flex: 1, height: 1, backgroundColor: C.line },
  daySum: { fontSize: 12, fontWeight: "800", color: C.text },
  dayCard: {
    backgroundColor: C.panel,
    borderRadius: R.lg,
    overflow: "hidden",
    marginBottom: 14,
    ...S.soft,
  },

  // Empty
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  emptyCopy: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
  emptyAction: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: C.brand + "12",
    borderRadius: R.pill,
  },
  emptyActionText: { color: C.brand, fontSize: 13, fontWeight: "700" },

  bottomSpacer: { height: 110 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
