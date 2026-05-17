import React, { useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Share,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Download } from "lucide-react-native";

import { useAppStore, useCurrentMonthTransactions } from "../stores/useAppStore";
import { brl, MonthNav, CAT_COLORS, CAT_LABELS, fintechTheme } from "../components/ui";
import { buildCashflowSeries } from "../src/application/dashboard/buildCashflowSeries.js";
import { buildCategoryBreakdown } from "../src/application/dashboard/buildCategoryBreakdown.js";
import { buildFinancialSummary } from "../src/application/dashboard/buildFinancialSummary.js";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;
const { width: W } = Dimensions.get("window");
const BAR_MAX_H = 100;

const PT_MONTHS_SHORT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

export default function RelatoriosScreen() {
  const router = useRouter();
  const { transactions, settings, currentDate, prevMonth, nextMonth } = useAppStore();
  const txMonth = useCurrentMonthTransactions();
  const [chartMode, setChartMode] = useState<"expense" | "income" | "investment">("expense");

  const summary = useMemo(() => buildFinancialSummary(txMonth), [txMonth]);

  const cashflow = useMemo(
    () => buildCashflowSeries({ transactions: transactions as any, currentDate: new Date(currentDate), monthCount: 6 }),
    [transactions, currentDate]
  );

  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown({ transactions: txMonth as any, categories: settings.categories.expense as any }),
    [txMonth, settings]
  );

  const totalExpense = summary.totals.expenses;
  const totalIncome = summary.totals.income;
  const totalInvest = summary.totals.investments;
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
    : 0;

  // Normaliza barras do cashflow
  const maxCashflow = Math.max(
    ...cashflow.map((m) => Math.max(m.income, m.expense, m.investment)), 1
  );
  const BAR_MAX_H = 100;

  const [y, mo] = currentDate.split("-").map(Number);
  const monthLabel = `${PT_MONTHS_SHORT[mo - 1]} ${y}`;

  function exportCSV() {
    const TYPE_LABEL: Record<string, string> = { expense: "Gasto", income: "Receita", investment: "Investimento" };
    const header = "Data,Tipo,Categoria,Descricao,Conta,Valor";
    const rows = txMonth.map((tx) => {
      const desc = tx.description.replace(/,/g, " ");
      const cat = tx.category.replace(/,/g, " ");
      const acc = (tx.account ?? "").replace(/,/g, " ");
      return `${tx.date},${TYPE_LABEL[tx.type] ?? tx.type},${cat},${desc},${acc},${tx.amount.toFixed(2)}`;
    });
    const csv = [header, ...rows].join("\n");
    Share.share({ message: csv, title: `Finance Flow - ${monthLabel}.csv` });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <Text style={styles.heroKicker}>Análise financeira</Text>
            <Text style={styles.heroTitle}>{monthLabel}</Text>
          </View>
          <View style={styles.heroRight}>
            <MonthNav currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} light />
            <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
              <Download size={16} color={C.gold} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Totais rápidos */}
        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Receitas</Text>
            <Text style={[styles.totalValue, { color: C.income }]}>{brl(totalIncome)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Gastos</Text>
            <Text style={[styles.totalValue, { color: C.expense }]}>{brl(totalExpense)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Investido</Text>
            <Text style={[styles.totalValue, { color: C.invest }]}>{brl(totalInvest)}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* ── TAXA DE POUPANÇA ── */}
        <View style={styles.card}>
          <View style={styles.savingsRow}>
            <View style={styles.savingsLeft}>
              <Text style={styles.cardTitle}>Taxa de poupança</Text>
              <Text style={styles.savingsSub}>
                {savingsRate >= 20
                  ? "Ótimo! Você está poupando bem."
                  : savingsRate >= 10
                  ? "Razoável. Tente poupar mais 5%."
                  : totalIncome === 0
                  ? "Registre suas receitas para calcular."
                  : "Atenção: gastos acima da receita."}
              </Text>
            </View>
            <View style={styles.savingsCircle}>
              <Text style={[
                styles.savingsRate,
                { color: savingsRate >= 20 ? C.income : savingsRate >= 10 ? C.warning : C.expense }
              ]}>
                {Math.max(0, savingsRate)}%
              </Text>
              <Text style={styles.savingsLabel}>poupado</Text>
            </View>
          </View>
          {totalIncome > 0 && (
            <View style={styles.savingsBar}>
              <View style={[
                styles.savingsFill,
                {
                  width: `${Math.min(100, Math.max(0, savingsRate))}%` as any,
                  backgroundColor: savingsRate >= 20 ? C.income : savingsRate >= 10 ? C.warning : C.expense,
                }
              ]} />
            </View>
          )}
        </View>

        {/* ── EVOLUÇÃO 6 MESES ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolução mensal</Text>

          {/* Toggle tipo */}
          <View style={styles.modeRow}>
            {([
              { key: "expense", label: "Gastos", color: C.expense },
              { key: "income", label: "Receitas", color: C.income },
              { key: "investment", label: "Investimentos", color: C.invest },
            ] as const).map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setChartMode(m.key)}
                style={[styles.modeBtn, chartMode === m.key && { backgroundColor: m.color }]}
              >
                <Text style={[styles.modeBtnText, chartMode === m.key && { color: "#fff" }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Barras verticais */}
          <View style={styles.barChart}>
            {cashflow.map((month) => {
              const val = month[chartMode];
              const h = maxCashflow > 0 ? Math.max(4, (val / maxCashflow) * BAR_MAX_H) : 4;
              const color = chartMode === "income" ? C.income : chartMode === "investment" ? C.invest : C.expense;
              const isCurrent = month.key === currentDate.slice(0, 7);
              return (
                <View key={month.key} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val > 0 ? brl(val).replace("R$ ", "") : "–"}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: h, backgroundColor: isCurrent ? color : color + "88" }]} />
                  </View>
                  <Text style={[styles.barLabel, isCurrent && { color: C.text, fontWeight: "800" }]}>
                    {month.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── DISTRIBUIÇÃO DE GASTOS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gastos por categoria</Text>
          {categoryBreakdown.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum gasto registrado neste mês.</Text>
          ) : (
            <View style={styles.catList}>
              {categoryBreakdown.map((row: any) => {
                const pct = totalExpense > 0 ? Math.round((row.value / totalExpense) * 100) : 0;
                const color = CAT_COLORS[row.key] || row.color || C.muted;
                return (
                  <View key={row.key} style={styles.catRow}>
                    <View style={styles.catMeta}>
                      <View style={[styles.catDot, { backgroundColor: color }]} />
                      <Text style={styles.catLabel}>{CAT_LABELS[row.key] || row.label}</Text>
                      <Text style={styles.catPct}>{pct}%</Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View style={[styles.catBar, { width: `${row.width}%` as any, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.catValue}>{brl(row.value)}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── SALDO PROJETADO ── */}
        {totalIncome > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo do mês</Text>
            <View style={styles.summaryGrid}>
              <SummaryTile label="Receita" value={brl(totalIncome)} color={C.income} />
              <SummaryTile label="Gastos" value={brl(totalExpense)} color={C.expense} />
              <SummaryTile label="Investido" value={brl(totalInvest)} color={C.invest} />
              <SummaryTile
                label="Disponível"
                value={brl(summary.totals.available)}
                color={summary.totals.available >= 0 ? C.income : C.expense}
              />
            </View>
          </View>
        )}

        {/* ── EXPORTAR ── */}
        <TouchableOpacity style={styles.exportCard} onPress={exportCSV} activeOpacity={0.82}>
          <View style={styles.exportIconBox}>
            <Download size={18} color={C.gold} strokeWidth={2.5} />
          </View>
          <View style={styles.exportText}>
            <Text style={styles.exportTitle}>Exportar lançamentos</Text>
            <Text style={styles.exportSub}>{txMonth.length} lançamentos · CSV · {monthLabel}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { borderLeftColor: color }]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { backgroundColor: C.panelAlt },

  // Hero
  hero: { backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 16 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center", justifyContent: "center",
  },
  heroCenter: { flex: 1, alignItems: "center" },
  heroKicker: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 2 },
  heroRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  exportBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(244,183,64,.15)",
    alignItems: "center", justifyContent: "center",
  },

  totalsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: R.md,
    padding: 14,
  },
  totalItem: { flex: 1, alignItems: "center", gap: 3 },
  totalLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.3 },
  totalValue: { fontSize: 14, fontWeight: "800" },
  totalDivider: { width: 1, backgroundColor: "rgba(255,255,255,.15)" },

  // Cards
  card: { backgroundColor: C.panel, margin: 16, marginBottom: 0, borderRadius: R.lg, padding: 16, ...S.soft },
  cardTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 14 },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center", paddingVertical: 20 },

  // Savings
  savingsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  savingsLeft: { flex: 1, marginRight: 16 },
  savingsSub: { fontSize: 13, color: C.muted, lineHeight: 19, marginTop: 4 },
  savingsCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.panelAlt,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.line,
  },
  savingsRate: { fontSize: 18, fontWeight: "900" },
  savingsLabel: { fontSize: 9, color: C.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  savingsBar: { height: 7, backgroundColor: C.line, borderRadius: 4, overflow: "hidden" },
  savingsFill: { height: "100%", borderRadius: 4 },

  // Bar chart
  modeRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  modeBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.pill,
    backgroundColor: C.panelAlt, borderWidth: 1, borderColor: C.line,
  },
  modeBtnText: { fontSize: 11, fontWeight: "700", color: C.muted },

  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: BAR_MAX_H + 48,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 9, color: C.muted, fontWeight: "600", textAlign: "center" },
  barTrack: { width: "100%", height: BAR_MAX_H, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10, color: C.muted, fontWeight: "600" },

  // Category bars
  catList: { gap: 14 },
  catRow: { gap: 6 },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 7 },
  catDot: { width: 9, height: 9, borderRadius: 5 },
  catLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: C.text },
  catPct: { fontSize: 12, fontWeight: "700", color: C.muted },
  catBarTrack: { height: 7, backgroundColor: C.line, borderRadius: 4, overflow: "hidden" },
  catBar: { height: "100%", borderRadius: 4 },
  catValue: { fontSize: 12, fontWeight: "700", color: C.text, alignSelf: "flex-end" },

  // Summary grid
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: (W - 32 - 32 - 10) / 2,
    backgroundColor: C.panelAlt,
    borderRadius: R.sm,
    padding: 12,
    borderLeftWidth: 3,
  },
  tileLabel: { fontSize: 11, color: C.muted, fontWeight: "600", marginBottom: 4 },
  tileValue: { fontSize: 16, fontWeight: "800" },

  // Export card
  exportCard: {
    backgroundColor: C.brand,
    margin: 16,
    marginBottom: 0,
    borderRadius: R.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: C.gold + "40",
    ...S.lift,
  },
  exportIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(244,183,64,.15)",
    alignItems: "center", justifyContent: "center",
  },
  exportText: { flex: 1 },
  exportTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  exportSub: { fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 },
});
