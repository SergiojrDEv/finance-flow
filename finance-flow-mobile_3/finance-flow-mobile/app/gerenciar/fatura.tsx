import React, { useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, CreditCard, Calendar, TrendingDown } from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { brl, fintechTheme, CAT_LABELS, CAT_COLORS } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

function cycleRange(closingDay: number, dueDay: number, referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed

  // Billing cycle: from last closing to this closing
  // If today is before or on closing day, current cycle started prev month's closing+1
  const today = referenceDate.getDate();
  const cycleMonth = today > closingDay ? month : month - 1;

  const startDate = new Date(year, cycleMonth, closingDay + 1);
  const endDate = new Date(year, cycleMonth + 1, closingDay);
  const dueDate = new Date(year, cycleMonth + 1, dueDay);

  return { startDate, endDate, dueDate };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function FaturaScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { settings, transactions, currentDate } = useAppStore();

  const card = settings.creditCards.find((c) => c.id === cardId);
  const cardColor = (card as any)?.color ?? C.brand2;

  const refDate = new Date(currentDate + "T12:00:00");
  const { startDate, endDate, dueDate } = useMemo(
    () => card ? cycleRange(card.closingDay, card.dueDay, refDate) : {
      startDate: new Date(), endDate: new Date(), dueDate: new Date()
    },
    [card, currentDate]
  );

  const billTxs = useMemo(() => {
    if (!card) return [];
    return transactions
      .filter((t) => {
        if (t.creditCardId !== card.id) return false;
        const d = new Date(t.date + "T12:00:00");
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, card, startDate, endDate]);

  const total = billTxs.reduce((s, t) => s + t.amount, 0);

  // Group by category
  const byCategory = useMemo(() => {
    const map: Record<string, { label: string; color: string; total: number; count: number }> = {};
    billTxs.forEach((t) => {
      const slug = t.category;
      if (!map[slug]) {
        map[slug] = {
          label: CAT_LABELS[slug] || slug,
          color: CAT_COLORS[slug] || C.muted,
          total: 0,
          count: 0,
        };
      }
      map[slug].total += t.amount;
      map[slug].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [billTxs]);

  if (!card) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Cartão não encontrado.</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daysUntilDue = Math.ceil((dueDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: cardColor }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <Text style={styles.heroKicker}>Fatura</Text>
            <Text style={styles.heroTitle}>{card.name}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Card visual */}
        <View style={styles.cardVisual}>
          <CreditCard size={20} color="rgba(255,255,255,.6)" strokeWidth={1.5} />
          <View style={styles.cardDetails}>
            <Text style={styles.cardTotal}>{brl(total)}</Text>
            <Text style={styles.cardCycleText}>
              {fmtDate(startDate)} – {fmtDate(endDate)}
            </Text>
          </View>
        </View>

        {/* Due date badge */}
        <View style={styles.dueBadge}>
          <Calendar size={13} color="rgba(255,255,255,.7)" />
          <Text style={styles.dueText}>
            Vence {fmtDate(dueDate)}
            {daysUntilDue >= 0 ? ` · ${daysUntilDue}d` : " · Vencida"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <View>
              <Text style={styles.slab}>Por categoria</Text>
              <View style={styles.catList}>
                {byCategory.map(([slug, info], idx) => {
                  const pct = total > 0 ? info.total / total : 0;
                  return (
                    <View key={slug} style={[styles.catRow, idx === byCategory.length - 1 && styles.catRowLast]}>
                      <View style={[styles.catDot, { backgroundColor: info.color }]} />
                      <View style={styles.catBody}>
                        <View style={styles.catTopRow}>
                          <Text style={styles.catLabel}>{info.label}</Text>
                          <Text style={styles.catAmount}>{brl(info.total)}</Text>
                        </View>
                        <View style={styles.catBar}>
                          <View style={[styles.catBarFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: info.color }]} />
                        </View>
                        <Text style={styles.catCount}>{info.count} lançamento{info.count !== 1 ? "s" : ""}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Transaction list */}
          <View>
            <Text style={styles.slab}>
              {billTxs.length > 0
                ? `${billTxs.length} lançamento${billTxs.length !== 1 ? "s" : ""}`
                : "Sem lançamentos"}
            </Text>

            {billTxs.length === 0 ? (
              <View style={styles.empty}>
                <TrendingDown size={32} color={C.line} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Fatura zerada</Text>
                <Text style={styles.emptyText}>
                  Nenhum gasto registrado para este cartão no ciclo atual.
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {billTxs.map((t, idx) => {
                  const catColor = CAT_COLORS[t.category] || C.muted;
                  return (
                    <View key={t.id} style={[styles.txRow, idx === billTxs.length - 1 && styles.txRowLast]}>
                      <View style={[styles.txDot, { backgroundColor: catColor + "22" }]}>
                        <View style={[styles.txDotInner, { backgroundColor: catColor }]} />
                      </View>
                      <View style={styles.txBody}>
                        <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                        <Text style={styles.txMeta}>
                          {CAT_LABELS[t.category] || t.category} · {t.date.split("-").reverse().slice(0, 2).join("/")}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>{brl(t.amount)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand2 },
  scroll: { backgroundColor: C.panelAlt },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { color: C.muted, fontSize: 15 },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.brand, borderRadius: R.md },
  backLinkText: { color: "#fff", fontWeight: "700" },

  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22, gap: 14 },
  heroTop: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center" },
  heroCenter: { flex: 1, alignItems: "center" },
  heroKicker: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 2 },

  cardVisual: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(0,0,0,.15)", borderRadius: R.md, padding: 14 },
  cardDetails: { flex: 1 },
  cardTotal: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  cardCycleText: { fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 },

  dueBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,.2)", borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dueText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,.75)" },

  content: { padding: 16, gap: 14 },
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  catList: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  catRow: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: C.line, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  catRowLast: { borderBottomWidth: 0 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  catBody: { flex: 1, gap: 5 },
  catTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catLabel: { fontSize: 13, fontWeight: "600", color: C.text },
  catAmount: { fontSize: 13, fontWeight: "800", color: C.text },
  catBar: { height: 4, backgroundColor: C.line, borderRadius: 2, overflow: "hidden" },
  catBarFill: { height: 4, borderRadius: 2 },
  catCount: { fontSize: 11, color: C.subtle },

  txList: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderBottomWidth: 0.5, borderBottomColor: C.line },
  txRowLast: { borderBottomWidth: 0 },
  txDot: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txDotInner: { width: 10, height: 10, borderRadius: 5 },
  txBody: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: "600", color: C.text },
  txMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "800", color: C.expense },

  empty: { backgroundColor: C.panel, borderRadius: R.lg, padding: 32, alignItems: "center", gap: 10, ...S.soft },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19 },
});
