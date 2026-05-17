import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Eye, EyeOff, Bell, ChevronRight, BarChart2, RefreshCw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore, useCurrentMonthTransactions } from "../../stores/useAppStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { brl, MonthNav, ProgressBar, CAT_LABELS, CAT_COLORS, fintechTheme } from "../../components/ui";
import { TransactionRow } from "../../components/ui/TransactionRow";

import { buildFinancialSummary } from "../../src/application/dashboard/buildFinancialSummary.js";
import { buildBudgetOverview } from "../../src/application/dashboard/buildBudgetOverview.js";
import { buildDashboardInsights } from "../../src/application/dashboard/buildDashboardInsights.js";
import { buildSmartDashboardView } from "../../src/dashboard/summaryPresenter.js";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { settings, currentDate, removeTransaction, prevMonth, nextMonth, recurringTransactions, applyRecurrents } = useAppStore();

  const txList = useCurrentMonthTransactions();
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => buildFinancialSummary(txList), [txList]);

  const smartView = useMemo(
    () =>
      buildSmartDashboardView({
        transactions: txList,
        totals: {
          income: summary.totals.income,
          expense: summary.totals.expenses,
          investment: summary.totals.investments,
        },
        free: summary.totals.available,
        currentDate: new Date(currentDate),
        previousSummary: summary,
      }),
    [txList, summary, currentDate]
  );

  const budgetRows = useMemo(
    () =>
      buildBudgetOverview({
        transactions: txList,
        budgetRules: settings.budgetRules,
        categories: settings.categories.expense,
        currentDate: new Date(currentDate),
      } as any),
    [txList, settings]
  );

  const insights = useMemo(
    () =>
      buildDashboardInsights({
        transactions: txList,
        expenseCategories: settings.categories.expense,
        budgetRules: settings.budgetRules,
        totals: summary.totals,
        today: new Date(),
      } as any),
    [txList, summary, settings, currentDate]
  );

  const recentTx = useMemo(
    () => [...txList].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [txList]
  );

  const currentMonth = currentDate.slice(0, 7);
  const pendingCount = useMemo(
    () => recurringTransactions.filter((r) => r.isActive && r.lastAppliedMonth !== currentMonth).length,
    [recurringTransactions, currentMonth]
  );

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  const available = summary.totals.available;
  const isPositive = available >= 0;
  const healthTone =
    summary.health.score >= 75
      ? C.success
      : summary.health.score >= 50
      ? C.warning
      : C.danger;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />
        }
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          {/* Topo: logo + mês + sino */}
          <View style={styles.heroTop}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandF}>F</Text>
              </View>
              <View>
                <Text style={styles.brandName}>Finance Flow</Text>
                <Text style={styles.brandSub}>Controle financeiro</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <MonthNav currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} light />
              <TouchableOpacity style={styles.bellBtn}>
                <Bell size={18} color="rgba(255,255,255,.65)" strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Saldo disponível */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Disponível para movimentação</Text>
              <TouchableOpacity onPress={() => setHideBalance((p) => !p)}>
                {hideBalance ? (
                  <EyeOff size={16} color="rgba(255,255,255,.65)" />
                ) : (
                  <Eye size={16} color="rgba(255,255,255,.65)" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.balanceValue, !isPositive && { color: "#ffd6dc" }]}>
              {hideBalance ? "R$ •••••" : brl(available)}
            </Text>
            {smartView.copy ? (
              <Text style={styles.balanceCopy} numberOfLines={2}>
                {smartView.copy}
              </Text>
            ) : null}
          </View>

          {/* Mini-cards R / D / I */}
          <View style={styles.miniCards}>
            <MiniCard
              letter="R"
              label="Receitas"
              value={hideBalance ? "•••" : brl(summary.totals.income)}
              color={C.income}
            />
            <MiniCard
              letter="D"
              label="Despesas"
              value={hideBalance ? "•••" : brl(summary.totals.expenses)}
              color={C.expense}
            />
            <MiniCard
              letter="I"
              label="Invest."
              value={hideBalance ? "•••" : brl(summary.totals.investments)}
              color={C.invest}
            />
          </View>
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          {/* Recorrentes pendentes */}
          {pendingCount > 0 && (
            <View style={styles.recurringBanner}>
              <View style={styles.recurringLeft}>
                <View style={styles.recurringIconBox}>
                  <RefreshCw size={16} color={C.gold} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.recurringTitle}>
                    {pendingCount} recorrente{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.recurringSubtitle}>Lançamentos automáticos do mês</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.recurringApplyBtn}
                onPress={() => applyRecurrents(currentMonth)}
              >
                <Text style={styles.recurringApplyText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ações rápidas */}
          <View style={styles.card}>
            <Text style={styles.slab}>Ações rápidas</Text>
            <View style={styles.qaRow}>
              <QAButton
                letter="R"
                label="Receita"
                color={C.income}
                onPress={() => router.push("/modal/lancamento?type=income")}
              />
              <QAButton
                letter="D"
                label="Despesa"
                color={C.expense}
                onPress={() => router.push("/modal/lancamento?type=expense")}
              />
              <QAButton
                letter="I"
                label="Investir"
                color={C.invest}
                onPress={() => router.push("/modal/lancamento?type=investment")}
              />
              <QAButton
                letter="M"
                label="Meta"
                color={C.balance}
                onPress={() => router.push("/tabs/metas")}
              />
            </View>
          </View>

          {/* Saúde financeira */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Saúde financeira</Text>
              <Text style={[styles.scoreText, { color: healthTone }]}>
                {summary.health.score}%
              </Text>
            </View>
            <ProgressBar
              value={summary.health.score}
              color={healthTone}
              height={7}
              style={styles.healthProgress}
            />
            <Text style={styles.cardCopy}>{summary.health.copy}</Text>
            {smartView.dailySafe && available > 0 && (
              <View style={styles.dailySafe}>
                <Text style={styles.dailySafeLabel}>
                  Gasto diário seguro até o fim do mês
                </Text>
                <Text style={styles.dailySafeValue}>{smartView.dailySafe}</Text>
              </View>
            )}
          </View>

          {/* Limites por categoria */}
          {budgetRows.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Limites por categoria</Text>
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => router.push("/tabs/orcamentos")}
                >
                  <Text style={styles.seeAll}>Ver todos</Text>
                  <ChevronRight size={14} color={C.brand} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <View style={styles.budgetList}>
                {budgetRows.slice(0, 4).map((row: any) => {
                  const pct = Number(row.pct?.monthly || 0);
                  const categoryKey = row.categorySlug || row.key;
                  const color = CAT_COLORS[categoryKey] || C.muted;
                  const tone = pct >= 100 ? C.danger : pct >= 80 ? C.warning : color;
                  return (
                    <View key={categoryKey}>
                      <View style={styles.budgetRow}>
                        <Text style={styles.budgetLabel}>
                          {CAT_LABELS[categoryKey] || row.label}
                        </Text>
                        <Text style={[styles.budgetPct, { color: tone }]}>
                          {Math.round(pct)}%
                        </Text>
                      </View>
                      <ProgressBar value={pct} color={tone} height={5} />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Alertas e insights */}
          {insights.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Alertas e insights</Text>
              <View style={styles.insightList}>
                {insights.slice(0, 3).map((item: any, i: number) => (
                  <View key={i} style={styles.insightRow}>
                    <Text style={styles.insightLabel}>{item.label}</Text>
                    <Text style={styles.insightValue} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Análise do mês */}
          <TouchableOpacity
            style={styles.analysisCard}
            onPress={() => router.push("/relatorios")}
            activeOpacity={0.82}
          >
            <View style={styles.analysisIcon}>
              <BarChart2 size={20} color={C.gold} strokeWidth={2} />
            </View>
            <View style={styles.analysisText}>
              <Text style={styles.analysisTitle}>Análise do mês</Text>
              <Text style={styles.analysisSub}>Gráficos, categorias e evolução</Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,.5)" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Lançamentos recentes */}
          <View style={[styles.card, styles.transactionsCard]}>
            <View style={[styles.cardHeader, styles.transactionsHeader]}>
              <Text style={styles.cardTitle}>Lançamentos recentes</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push("/tabs/carteira")}
              >
                <Text style={styles.seeAll}>Ver todos</Text>
                <ChevronRight size={14} color={C.brand} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            {recentTx.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyRecentText}>
                  Nenhum lançamento neste mês
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => router.push("/modal/lancamento")}
                >
                  <Text style={styles.emptyActionText}>+ Adicionar lançamento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentTx.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} onDelete={removeTransaction} />
              ))
            )}
          </View>

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

function MiniCard({
  letter,
  label,
  value,
  color,
}: {
  letter: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.miniCard}>
      <View style={[styles.miniLetterBox, { backgroundColor: color + "30" }]}>
        <Text style={[styles.miniLetterText, { color }]}>{letter}</Text>
      </View>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function QAButton({
  letter,
  label,
  color,
  onPress,
}: {
  letter: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.qa} onPress={onPress} activeOpacity={0.72}>
      <View style={[styles.qaIco, { borderColor: color, backgroundColor: color + "14" }]}>
        <Text style={[styles.qaLetter, { color }]}>{letter}</Text>
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { flex: 1, backgroundColor: C.panelAlt },

  // Hero
  hero: {
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 20,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  brandF: { fontSize: 16, fontWeight: "900", color: C.brand },
  brandName: { fontSize: 14, fontWeight: "800", color: "#fff" },
  brandSub: { fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 1 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Balance
  balanceSection: { gap: 6 },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,.55)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.5,
  },
  balanceCopy: {
    fontSize: 12,
    color: "rgba(255,255,255,.6)",
    lineHeight: 18,
  },

  // Mini-cards
  miniCards: { flexDirection: "row", gap: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: R.sm,
    padding: 12,
    gap: 4,
  },
  miniLetterBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  miniLetterText: { fontSize: 13, fontWeight: "900" },
  miniLabel: { fontSize: 10, color: "rgba(255,255,255,.55)", fontWeight: "600" },
  miniValue: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  card: { backgroundColor: C.panel, borderRadius: R.lg, padding: 16, ...S.soft },
  slab: {
    fontSize: 11,
    fontWeight: "800",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 14,
  },

  // Quick actions
  qaRow: { flexDirection: "row", gap: 10 },
  qa: { flex: 1, alignItems: "center", gap: 7 },
  qaIco: {
    width: 52,
    height: 52,
    borderRadius: R.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLetter: { fontSize: 18, fontWeight: "900" },
  qaLabel: { fontSize: 11, fontWeight: "700", color: C.text },

  // Cards
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  cardCopy: { fontSize: 13, color: C.muted, lineHeight: 19 },
  scoreText: { fontSize: 16, fontWeight: "800" },
  healthProgress: { marginBottom: 10 },
  dailySafe: {
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: R.sm,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dailySafeLabel: { fontSize: 12, color: "#065f46", flex: 1 },
  dailySafeValue: { fontSize: 15, fontWeight: "800", color: C.success },
  budgetList: { marginTop: 10, gap: 10 },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  budgetLabel: { fontSize: 13, color: C.text, fontWeight: "600" },
  budgetPct: { fontSize: 12, fontWeight: "700" },
  insightList: { marginTop: 6, gap: 8 },
  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
    gap: 12,
  },
  insightLabel: { fontSize: 12, color: C.muted, flex: 1 },
  insightValue: { fontSize: 12, fontWeight: "700", color: C.text, maxWidth: "50%" },

  // Transactions
  transactionsCard: { paddingHorizontal: 0, paddingBottom: 0, overflow: "hidden" },
  transactionsHeader: { paddingHorizontal: 16 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: 13, color: C.brand, fontWeight: "700" },
  emptyRecent: { padding: 28, alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyRecentText: { color: C.subtle, fontSize: 13, textAlign: "center" },
  emptyAction: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: C.brand + "12",
    borderRadius: R.pill,
  },
  emptyActionText: { color: C.brand, fontSize: 13, fontWeight: "700" },

  // Analysis card
  analysisCard: {
    backgroundColor: C.brand,
    borderRadius: R.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...S.lift,
  },
  analysisIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(244,183,64,.15)",
    alignItems: "center", justifyContent: "center",
  },
  analysisText: { flex: 1 },
  analysisTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  analysisSub: { fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 },

  // Recurring banner
  recurringBanner: {
    backgroundColor: C.brand,
    borderRadius: R.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: C.gold + "40",
    ...S.soft,
  },
  recurringLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  recurringIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.gold + "20",
    alignItems: "center", justifyContent: "center",
  },
  recurringTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  recurringSubtitle: { fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 },
  recurringApplyBtn: {
    backgroundColor: C.gold,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recurringApplyText: { fontSize: 13, fontWeight: "800", color: C.brand },

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
