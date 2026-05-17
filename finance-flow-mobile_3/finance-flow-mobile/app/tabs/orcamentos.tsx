import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Check, SlidersHorizontal, TrendingDown } from "lucide-react-native";

import { useAppStore, useCurrentMonthTransactions } from "../../stores/useAppStore";
import { brl, MonthNav, ProgressBar, CAT_LABELS, CAT_COLORS, fintechTheme } from "../../components/ui";
import { buildBudgetOverview } from "../../src/application/dashboard/buildBudgetOverview.js";
import { sendBudgetAlert } from "../../lib/notifications";
import * as Notifications from "expo-notifications";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

export default function OrcamentosScreen() {
  const { settings, currentDate, prevMonth, nextMonth, upsertBudget } = useAppStore();
  const txList = useCurrentMonthTransactions();

  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [weeklyInput, setWeeklyInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");

  const categories = useMemo(() => settings.categories.expense, [settings]);
  const budgetRules = useMemo(() => settings.budgetRules, [settings]);

  const rows = useMemo(
    () => buildBudgetOverview({ transactions: txList, budgetRules, categories, currentDate: new Date(currentDate) } as any),
    [txList, budgetRules, categories, currentDate]
  );

  const totalBudget = Object.values(budgetRules).reduce((s, r) => s + Number(r.monthly || 0), 0);
  const totalSpent = txList.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const remaining = Math.max(0, totalBudget - totalSpent);
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const overallTone = totalSpent > totalBudget ? C.expense : overallPct >= 80 ? C.warning : C.balance;

  // Fire budget alerts for categories at ≥80%, once per session
  const alertedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;
      (rows as any[]).forEach((row: any) => {
        const pct = row.monthlyPct ?? row.pct ?? 0;
        const slug = row.slug ?? row.category;
        const label = row.label ?? slug;
        if (pct >= 80 && !alertedRef.current.has(slug)) {
          alertedRef.current.add(slug);
          sendBudgetAlert(label, Math.round(pct)).catch(() => {});
        }
      });
    });
  }, [rows]);

  function openEdit(slug: string) {
    const rule = settings.budgetRules[slug];
    setWeeklyInput(rule ? String(rule.weekly) : "");
    setMonthlyInput(rule ? String(rule.monthly) : "");
    setEditSlug(slug);
  }

  function saveEdit() {
    if (!editSlug) return;
    const weekly = parseFloat(weeklyInput);
    const monthly = parseFloat(monthlyInput);
    if (isNaN(weekly) || isNaN(monthly) || weekly < 0 || monthly < 0) {
      Alert.alert("Valor inválido", "Digite valores numéricos positivos.");
      return;
    }
    upsertBudget({ categorySlug: editSlug, weeklyLimit: weekly, monthlyLimit: monthly });
    const newRules = { ...settings.budgetRules, [editSlug]: { weekly, monthly } };
    useAppStore.getState().updateSettings({ budgetRules: newRules });
    setEditSlug(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroKicker}>Controle de gastos</Text>
              <Text style={styles.heroTitle}>Limites</Text>
            </View>
            <MonthNav currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} light />
          </View>

          {/* Resumo mensal */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Planejado</Text>
              <Text style={styles.summaryValue}>{brl(totalBudget)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: C.expense + "cc" }]}>Gasto</Text>
              <Text style={[styles.summaryValue, { color: C.expense }]}>{brl(totalSpent)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: C.income + "cc" }]}>Restante</Text>
              <Text style={[styles.summaryValue, { color: C.income }]}>{brl(remaining)}</Text>
            </View>
          </View>

          {/* Barra geral */}
          {totalBudget > 0 && (
            <View style={styles.overallBar}>
              <View style={styles.overallBarTrack}>
                <View style={[styles.overallBarFill, { width: `${overallPct}%` as any, backgroundColor: overallTone }]} />
              </View>
              <Text style={styles.overallPctText}>{overallPct}% do limite mensal usado</Text>
            </View>
          )}
        </View>

        {/* ── CARDS ── */}
        <View style={styles.content}>
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>Nenhum limite definido</Text>
              <Text style={styles.emptyCopy}>
                Adicione lançamentos de despesa primeiro. Os limites aparecem por categoria automaticamente.
              </Text>
            </View>
          ) : (
            rows.map((row: any) => {
              const pctM = Math.round(Number(row.pct?.monthly || 0));
              const pctW = Math.round(Number(row.pct?.weekly || 0));
              const categoryKey = row.categorySlug || row.key;
              const color = CAT_COLORS[categoryKey] || C.muted;
              const toneM = pctM >= 100 ? C.expense : pctM >= 80 ? C.warning : color;
              const toneW = pctW >= 100 ? C.expense : pctW >= 80 ? C.warning : color;
              const hasRule = row.rule?.monthly > 0;

              return (
                <View key={categoryKey} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.catRow}>
                      <View style={[styles.catDot, { backgroundColor: color }]} />
                      <Text style={styles.catName}>{CAT_LABELS[categoryKey] || row.label}</Text>
                      {pctM >= 100 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Estourado</Text>
                        </View>
                      )}
                      {pctM >= 80 && pctM < 100 && (
                        <View style={[styles.badge, { backgroundColor: "#fff3bf" }]}>
                          <Text style={[styles.badgeText, { color: "#7d5700" }]}>Atenção</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(categoryKey)}>
                      <SlidersHorizontal size={15} color={C.subtle} />
                    </TouchableOpacity>
                  </View>

                  {hasRule ? (
                    <>
                      {/* Mensal */}
                      <View style={styles.meter}>
                        <View style={styles.meterRow}>
                          <Text style={styles.meterLabel}>Mensal</Text>
                          <Text style={styles.meterVal}>
                            <Text style={{ color: toneM, fontWeight: "700" }}>{brl(row.used?.monthly || 0)}</Text>
                            <Text style={{ color: C.subtle }}> / {brl(row.rule?.monthly || 0)}</Text>
                          </Text>
                        </View>
                        <ProgressBar value={pctM} color={toneM} height={6} />
                      </View>

                      {/* Semanal */}
                      <View style={[styles.meter, { marginTop: 10 }]}>
                        <View style={styles.meterRow}>
                          <Text style={styles.meterLabel}>Semana atual</Text>
                          <Text style={styles.meterVal}>
                            <Text style={{ color: toneW, fontWeight: "700" }}>{brl(row.used?.weekly || 0)}</Text>
                            <Text style={{ color: C.subtle }}> / {brl(row.rule?.weekly || 0)}</Text>
                          </Text>
                        </View>
                        <ProgressBar value={pctW} color={toneW} height={6} />
                      </View>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.noRuleBtn} onPress={() => openEdit(categoryKey)}>
                      <TrendingDown size={13} color={C.muted} />
                      <Text style={styles.noRuleText}>
                        Gasto: {brl(row.used?.monthly || 0)} · Toque para definir limite
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* Modal de edição */}
      <Modal visible={editSlug !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Limite · {CAT_LABELS[editSlug || ""] || editSlug}
              </Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEditSlug(null)}>
                <X size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Limite semanal (R$)</Text>
              <TextInput
                style={styles.fieldInput} value={weeklyInput} onChangeText={setWeeklyInput}
                keyboardType="numeric" placeholder="Ex: 350" placeholderTextColor={C.subtle}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Limite mensal (R$)</Text>
              <TextInput
                style={styles.fieldInput} value={monthlyInput} onChangeText={setMonthlyInput}
                keyboardType="numeric" placeholder="Ex: 1400" placeholderTextColor={C.subtle}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Salvar limites</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.panelAlt },

  // Hero
  hero: { backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 18 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroKicker: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 2 },

  summaryRow: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: R.md, padding: 14,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: 0.3 },
  summaryValue: { fontSize: 15, fontWeight: "800", color: "#fff" },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,.15)" },

  overallBar: { gap: 6 },
  overallBarTrack: { height: 6, backgroundColor: "rgba(255,255,255,.2)", borderRadius: 3, overflow: "hidden" },
  overallBarFill: { height: "100%", borderRadius: 3 },
  overallPctText: { fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: "600" },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: { backgroundColor: C.panel, borderRadius: R.lg, padding: 16, ...S.soft },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 15, fontWeight: "700", color: C.text },
  badge: { backgroundColor: "#fee2e2", paddingHorizontal: 7, paddingVertical: 3, borderRadius: R.pill },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#b91c1c" },
  editBtn: { padding: 8, backgroundColor: C.panelAlt, borderRadius: R.sm },

  meter: {},
  meterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  meterLabel: { fontSize: 12, color: C.muted, fontWeight: "600" },
  meterVal: { fontSize: 12 },

  noRuleBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.panelAlt, borderRadius: R.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.line, borderStyle: "dashed",
  },
  noRuleText: { fontSize: 12, color: C.muted, fontWeight: "600" },

  // Empty
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 8 },
  emptyIcon: { fontSize: 36, opacity: 0.5 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: C.text, textAlign: "center" },
  emptyCopy: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(7,17,31,.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.panel, borderRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 22 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center" },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: C.muted, fontWeight: "800", marginBottom: 7 },
  fieldInput: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 13, fontSize: 15, color: C.text, backgroundColor: C.panelAlt },
  saveBtn: { backgroundColor: C.brand, borderRadius: R.md, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
