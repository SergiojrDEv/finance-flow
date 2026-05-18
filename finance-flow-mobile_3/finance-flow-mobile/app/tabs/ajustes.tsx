import React, { useMemo, useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogOut, CreditCard, Tag, Target,
  Bell, Database, Trash2, ChevronRight, ShieldCheck, SlidersHorizontal, RefreshCw, Cloud,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme } from "../../components/ui";
import { buildFinancialSummary } from "../../src/application/dashboard/buildFinancialSummary.js";

let Notifications: any = null;
let setupNotifications: any = async () => false;
try {
  Notifications = require("expo-notifications");
  setupNotifications = require("../../lib/notifications").setupNotifications;
} catch {
  // notifications not available
}

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const SCORE_BANDS = [
  { label: "Crítico",  color: "#e53e3e" },
  { label: "Regular",  color: "#dd6b20" },
  { label: "Bom",      color: "#d69e2e" },
  { label: "Ótimo",    color: "#38a169" },
];

function scoreLabel(score: number) {
  if (score >= 75) return { label: "Ótimo",   color: "#38a169" };
  if (score >= 50) return { label: "Bom",     color: "#d69e2e" };
  if (score >= 25) return { label: "Regular", color: "#dd6b20" };
  return             { label: "Crítico",  color: "#e53e3e" };
}

export default function AjustesScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { transactions, settings, goals, recurringTransactions, isSyncing, lastSyncAt, pushNow } = useAppStore();
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Check current notification permission on mount
  useEffect(() => {
    try {
      Notifications?.getPermissionsAsync?.()?.then?.(({ status }: any) => {
        setNotifEnabled(status === "granted");
      });
    } catch {
      // ignore
    }
  }, []);

  async function handleNotifToggle(value: boolean) {
    const granted = await setupNotifications(value, recurringTransactions);
    if (value && !granted) {
      Alert.alert(
        "Permissão negada",
        "Habilite as notificações nas configurações do dispositivo para receber alertas do Finance Flow."
      );
      return;
    }
    setNotifEnabled(value);
  }

  const summary = useMemo(() => {
    try {
      return buildFinancialSummary(transactions.slice(-100));
    } catch {
      return { health: { score: 0, status: "empty", copy: "" }, totals: {}, counts: {}, rates: {} };
    }
  }, [transactions]);
  const score = summary?.health?.score ?? 0;
  const band = scoreLabel(score);

  const name = user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Usuário";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const activeGoals = goals.filter((g) => !g.isArchived).length;

  function confirmSignOut() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut },
    ]);
  }

  function confirmClear() {
    Alert.alert(
      "Apagar todos os dados",
      "Esta ação é irreversível. Todos os lançamentos locais serão removidos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar tudo", style: "destructive",
          onPress: () => useAppStore.setState({ transactions: [], goals: [] }) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.heroKicker}>Painel financeiro</Text>
                <Text style={styles.heroName}>{name}</Text>
              </View>
            </View>
            <View style={[styles.syncBadge, { backgroundColor: user ? "#10b98122" : "#ffffff22" }]}>
              <View style={[styles.syncDot, { backgroundColor: user ? "#10b981" : "#94a3b8" }]} />
              <Text style={styles.syncText}>{user ? "Conectado" : "Offline"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── FINANCIAL PASSPORT ── */}
          <View style={styles.passport}>
            <View style={styles.passportTop}>
              <View style={styles.passportBrand}>
                <View style={styles.passportMark}>
                  <Text style={styles.passportF}>F</Text>
                </View>
                <View>
                  <Text style={styles.passportName}>Finance Flow</Text>
                  <Text style={styles.passportSub}>Controle financeiro</Text>
                </View>
              </View>
              <View style={styles.passportScoreWrap}>
                <Text style={styles.passportScoreLabel}>SCORE</Text>
                <View style={styles.passportScoreRow}>
                  <Text style={[styles.passportScore, { color: C.gold }]}>{score}</Text>
                  <Text style={styles.passportScoreMax}>/100</Text>
                </View>
              </View>
            </View>

            {/* Barra de saúde */}
            <View style={styles.barWrap}>
              <View style={styles.gradBar}>
                {SCORE_BANDS.map((b) => (
                  <View key={b.label} style={[styles.barSegment, { backgroundColor: b.color }]} />
                ))}
                {/* Indicador */}
                <View style={[styles.barIndicator, { left: `${Math.min(score, 98)}%` as any }]} />
              </View>
              <View style={styles.barLabels}>
                {SCORE_BANDS.map((b) => (
                  <Text key={b.label} style={styles.barLabel}>{b.label}</Text>
                ))}
              </View>
            </View>

            {/* Stats grid */}
            <View style={styles.passportStats}>
              <PassportStat value={settings.categories.expense.length} label="categorias" />
              <View style={styles.statDivider} />
              <PassportStat value={settings.accounts.length} label="contas" />
              <View style={styles.statDivider} />
              <PassportStat value={activeGoals} label="metas" />
              <View style={styles.statDivider} />
              <PassportStat value={transactions.length} label="lançamentos" />
            </View>
          </View>

          {/* ── ORGANIZAÇÃO ── */}
          <View>
            <Text style={styles.slab}>Organização</Text>
            <View style={styles.section}>
              <SRow
                icon={<Tag size={16} color={C.balance} />}
                bg={C.balance + "18"}
                label="Categorias"
                value={`${settings.categories.expense.length + settings.categories.income.length} ativas`}
                onPress={() => router.push("/gerenciar/categorias")}
              />
              <SRow
                icon={<Database size={16} color={C.invest} />}
                bg={C.invest + "18"}
                label="Contas"
                value={`${settings.accounts.length} ativa${settings.accounts.length !== 1 ? "s" : ""}`}
                onPress={() => router.push("/gerenciar/contas")}
              />
              <SRow
                icon={<CreditCard size={16} color={C.expense} />}
                bg={C.expense + "18"}
                label="Cartões de crédito"
                value={`${settings.creditCards.length} cartão${settings.creditCards.length !== 1 ? "s" : ""}`}
                onPress={() => router.push("/gerenciar/cartoes")}
              />
              <SRow
                icon={<RefreshCw size={16} color="#0b7285" />}
                bg="#e3fafc"
                label="Lançamentos recorrentes"
                value={`${recurringTransactions.filter((r) => r.isActive).length} ativo${recurringTransactions.filter((r) => r.isActive).length !== 1 ? "s" : ""}`}
                onPress={() => router.push("/gerenciar/recorrentes")}
              />
              <SRow
                icon={<Target size={16} color={C.income} />}
                bg={C.income + "18"}
                label="Metas"
                value={`${activeGoals} ativa${activeGoals !== 1 ? "s" : ""}`}
                onPress={() => router.push("/tabs/metas")}
              />
              <SRow
                icon={<SlidersHorizontal size={16} color="#7c3aed" />}
                bg="#f3e8ff"
                label="Limites e Orçamentos"
                value="Controle de gastos"
                onPress={() => router.push("/tabs/orcamentos")}
                last
              />
            </View>
          </View>

          {/* ── PREFERÊNCIAS ── */}
          <View>
            <Text style={styles.slab}>Preferências</Text>
            <View style={styles.section}>
              <SRow
                icon={<Bell size={16} color="#f08c00" />}
                bg="#fff3bf"
                label="Notificações"
                right={
                  <Switch
                    value={notifEnabled}
                    onValueChange={handleNotifToggle}
                    trackColor={{ false: C.line, true: C.brand }}
                    ios_backgroundColor={C.line}
                  />
                }
              />
              <SRow
                icon={<Cloud size={16} color={isSyncing ? C.warning : user ? C.success : C.muted} />}
                bg={(isSyncing ? C.warning : user ? C.success : C.muted) + "18"}
                label="Sincronização"
                value={
                  isSyncing
                    ? "Sincronizando..."
                    : lastSyncAt
                    ? `Última sync ${new Date(lastSyncAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                    : user ? "Não sincronizado" : "Sem conexão"
                }
                onPress={user ? () => pushNow(user.id) : undefined}
                right={
                  isSyncing
                    ? <RefreshCw size={14} color={C.warning} />
                    : <View style={[styles.statusDot, { backgroundColor: user ? C.success : C.line }]} />
                }
                last
              />
            </View>
          </View>

          {/* ── CONTA ── */}
          <View>
            <Text style={styles.slab}>Conta</Text>
            <View style={styles.section}>
              <SRow
                icon={<LogOut size={16} color={C.expense} />}
                bg={C.expense + "18"}
                label="Sair da conta"
                value={user?.email || ""}
                onPress={confirmSignOut}
                last
              />
            </View>
          </View>

          {/* ── ZONA DE RISCO ── */}
          <View>
            <Text style={styles.slab}>Zona de risco</Text>
            <View style={styles.section}>
              <SRow
                icon={<Trash2 size={16} color={C.expense} />}
                bg={C.expense + "14"}
                label="Apagar todos os dados locais"
                onPress={confirmClear}
                danger
                last
              />
            </View>
          </View>

          <Text style={styles.version}>Finance Flow v1.0.0 · Dados com Supabase</Text>
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PassportStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.passportStat}>
      <Text style={styles.passportStatValue}>{value}</Text>
      <Text style={styles.passportStatLabel}>{label}</Text>
    </View>
  );
}

function SRow({ icon, bg, label, value, onPress, danger, right, last }: {
  icon: React.ReactNode; bg: string; label: string;
  value?: string; onPress?: () => void; danger?: boolean;
  right?: React.ReactNode; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && { color: C.expense }]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {right ?? (onPress && <ChevronRight size={15} color={C.subtle} />)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.panelAlt },

  // Hero
  hero: { backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.gold, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: C.brand },
  heroKicker: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 0.4 },
  heroName: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 1 },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.7)" },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  // Passport card
  passport: {
    backgroundColor: C.brand2,
    borderRadius: R.lg,
    padding: 18,
    gap: 16,
    ...S.lift,
  },
  passportTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  passportBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  passportMark: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  passportF: { fontSize: 14, fontWeight: "900", color: C.brand },
  passportName: { fontSize: 13, fontWeight: "800", color: "#fff" },
  passportSub: { fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 1 },
  passportScoreWrap: { alignItems: "flex-end" },
  passportScoreLabel: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,.45)", letterSpacing: 1 },
  passportScoreRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  passportScore: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  passportScoreMax: { fontSize: 14, color: "rgba(255,255,255,.4)", fontWeight: "700" },

  // Gradient bar
  barWrap: { gap: 5 },
  gradBar: { height: 7, borderRadius: 4, flexDirection: "row", overflow: "hidden", position: "relative" },
  barSegment: { flex: 1 },
  barIndicator: {
    position: "absolute", top: -2, width: 11, height: 11,
    borderRadius: 6, backgroundColor: "#fff",
    borderWidth: 2, borderColor: C.brand2,
    marginLeft: -5,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  barLabels: { flexDirection: "row" },
  barLabel: { flex: 1, fontSize: 9, color: "rgba(255,255,255,.4)", fontWeight: "600" },

  // Passport stats
  passportStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,.07)",
    borderRadius: R.sm,
    paddingVertical: 12,
  },
  passportStat: { flex: 1, alignItems: "center", gap: 3 },
  passportStatValue: { fontSize: 18, fontWeight: "900", color: "#fff" },
  passportStatLabel: { fontSize: 9, color: "rgba(255,255,255,.45)", fontWeight: "700", textTransform: "uppercase" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,.12)" },

  // Sections
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  section: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: C.line },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  rowValue: { fontSize: 12, color: C.subtle, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  version: { fontSize: 11, color: C.subtle, textAlign: "center", marginTop: 4 },
});
