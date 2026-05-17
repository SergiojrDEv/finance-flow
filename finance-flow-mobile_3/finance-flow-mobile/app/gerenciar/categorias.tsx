import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { CAT_COLORS, CAT_LABELS, fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

type TabKey = "expense" | "income" | "investment";

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "expense",    label: "Despesas",     color: C.expense },
  { key: "income",     label: "Receitas",     color: C.income },
  { key: "investment", label: "Investimentos", color: C.invest },
];

const CAT_EMOJI: Record<string, string> = {
  moradia: "🏠", alimentacao: "🍽️", transporte: "🚗",
  saude: "❤️", lazer: "🎮", educacao: "📚", outros: "📦",
  salario: "💰", freelance: "💻", rendimento: "📈",
  "renda-fixa": "🏦", acoes: "📊", fundos: "💼",
  cripto: "₿", previdencia: "🛡️",
};

export default function CategoriasScreen() {
  const router = useRouter();
  const { settings, transactions, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("expense");

  const categories = settings.categories[activeTab] as [string, string, string, ...any[]][];
  const activeColor = TABS.find((t) => t.key === activeTab)!.color;

  function txCount(slug: string) {
    return transactions.filter((t) => t.category === slug && t.type === activeTab).length;
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const updated = [...categories];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    updateSettings({ categories: { ...settings.categories, [activeTab]: updated } });
  }

  function moveDown(idx: number) {
    if (idx === categories.length - 1) return;
    const updated = [...categories];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    updateSettings({ categories: { ...settings.categories, [activeTab]: updated } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
        </TouchableOpacity>
        <View style={styles.heroCenter}>
          <Text style={styles.heroKicker}>Ajustes</Text>
          <Text style={styles.heroTitle}>Categorias</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color, fontWeight: "800" }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.slab}>{categories.length} categoria{categories.length !== 1 ? "s" : ""}</Text>

          <View style={styles.list}>
            {categories.map(([slug, label, color], idx) => {
              const count = txCount(slug);
              const catColor = CAT_COLORS[slug] || color || C.muted;
              const emoji = CAT_EMOJI[slug] || "📦";
              return (
                <View key={slug} style={[styles.row, idx === categories.length - 1 && styles.rowLast]}>
                  {/* Ícone */}
                  <View style={[styles.catIcon, { backgroundColor: catColor + "18" }]}>
                    <Text style={styles.catEmoji}>{emoji}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.rowBody}>
                    <Text style={styles.catName}>{CAT_LABELS[slug] || label}</Text>
                    <Text style={styles.catMeta}>
                      {count > 0 ? `${count} lançamento${count !== 1 ? "s" : ""}` : "Nenhum lançamento"}
                    </Text>
                  </View>

                  {/* Dot de cor */}
                  <View style={[styles.colorDot, { backgroundColor: catColor }]} />

                  {/* Reordenar */}
                  <View style={styles.orderBtns}>
                    <TouchableOpacity
                      style={[styles.orderBtn, idx === 0 && styles.orderBtnDisabled]}
                      onPress={() => moveUp(idx)}
                      disabled={idx === 0}
                    >
                      <Text style={styles.orderArrow}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.orderBtn, idx === categories.length - 1 && styles.orderBtnDisabled]}
                      onPress={() => moveDown(idx)}
                      disabled={idx === categories.length - 1}
                    >
                      <Text style={styles.orderArrow}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Sobre as categorias</Text>
            <Text style={styles.infoText}>
              As categorias organizam seus lançamentos e orçamentos. Use as setas para reordenar conforme sua preferência — a ordem aparece no modal de lançamento.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { backgroundColor: C.panelAlt },

  hero: {
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center", justifyContent: "center",
  },
  heroCenter: { flex: 1, alignItems: "center" },
  heroKicker: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: C.brand,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,.1)",
  },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: "center",
    borderBottomWidth: 2.5, borderBottomColor: "transparent",
  },
  tabText: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,.5)" },

  content: { padding: 16, gap: 12 },
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },

  list: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  rowLast: { borderBottomWidth: 0 },
  catIcon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  catEmoji: { fontSize: 19 },
  rowBody: { flex: 1, minWidth: 0 },
  catName: { fontSize: 14, fontWeight: "600", color: C.text },
  catMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  orderBtns: { flexDirection: "column", gap: 2 },
  orderBtn: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: C.panelAlt,
    alignItems: "center", justifyContent: "center",
  },
  orderBtnDisabled: { opacity: 0.25 },
  orderArrow: { fontSize: 14, color: C.brand, fontWeight: "700", lineHeight: 18 },

  infoCard: {
    backgroundColor: C.brand + "0e",
    borderRadius: R.md,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.brand + "44",
  },
  infoTitle: { fontSize: 12, fontWeight: "800", color: C.brand, marginBottom: 6 },
  infoText: { fontSize: 12, color: C.muted, lineHeight: 18 },
});
