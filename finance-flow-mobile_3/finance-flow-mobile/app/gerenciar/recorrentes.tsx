import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, TextInput, Modal, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft, Plus, Trash2, RefreshCw, Check, X, ChevronRight,
} from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme } from "../../components/ui";
import type { RecurringTransaction, TransactionType, PaymentMethod } from "../../types";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const TYPE_OPTIONS: { key: TransactionType; label: string; color: string }[] = [
  { key: "expense",    label: "Despesa",      color: C.expense },
  { key: "income",     label: "Receita",      color: C.income },
  { key: "investment", label: "Investimento", color: C.invest },
];

interface Draft {
  type: TransactionType;
  amount: string;
  description: string;
  category: string;
  account: string;
  dayOfMonth: string;
}

const emptyDraft = (): Draft => ({
  type: "expense",
  amount: "",
  description: "",
  category: "",
  account: "",
  dayOfMonth: "5",
});

function typeColor(type: TransactionType) {
  return TYPE_OPTIONS.find((t) => t.key === type)?.color ?? C.muted;
}

function typeLabel(type: TransactionType) {
  return TYPE_OPTIONS.find((t) => t.key === type)?.label ?? type;
}

export default function RecorrentesScreen() {
  const router = useRouter();
  const { recurringTransactions, settings, addRecurring, removeRecurring, toggleRecurring, applyRecurrents, currentDate } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const currentMonth = currentDate.slice(0, 7); // "yyyy-mm"
  const [y, m] = currentMonth.split("-");
  const monthName = new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const pendingCount = recurringTransactions.filter(
    (r) => r.isActive && r.lastAppliedMonth !== currentMonth
  ).length;

  function openAdd() {
    setDraft(emptyDraft());
    setModalVisible(true);
  }

  function saveDraft() {
    const desc = draft.description.trim();
    if (!desc) { Alert.alert("Campo obrigatório", "Informe uma descrição."); return; }
    const amount = parseFloat(draft.amount.replace(",", "."));
    if (!amount || amount <= 0) { Alert.alert("Valor inválido", "Informe um valor maior que zero."); return; }
    const day = parseInt(draft.dayOfMonth) || 5;
    if (day < 1 || day > 28) { Alert.alert("Dia inválido", "O dia deve ser entre 1 e 28."); return; }

    const cats = settings.categories[draft.type] as [string, string, string, ...any[]][];
    const category = draft.category || (cats[0]?.[0] ?? "outros");
    const account = draft.account || settings.accounts[0] || "";

    addRecurring({
      id: Date.now().toString(),
      type: draft.type,
      amount,
      description: desc,
      category,
      account,
      dayOfMonth: day,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setModalVisible(false);
  }

  function confirmDelete(id: string, desc: string) {
    Alert.alert(`Remover "${desc}"`, "Deseja remover este lançamento recorrente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => removeRecurring(id) },
    ]);
  }

  function handleApply() {
    if (pendingCount === 0) {
      Alert.alert("Já aplicado", `Todos os recorrentes ativos já foram lançados em ${monthName}.`);
      return;
    }
    Alert.alert(
      "Aplicar recorrentes",
      `Criar ${pendingCount} lançamento${pendingCount !== 1 ? "s" : ""} para ${monthName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aplicar", onPress: () => { applyRecurrents(currentMonth); Alert.alert("Pronto!", `${pendingCount} lançamento${pendingCount !== 1 ? "s" : ""} criado${pendingCount !== 1 ? "s" : ""}.`); } },
      ]
    );
  }

  const cats = settings.categories[draft.type] as [string, string, string, ...any[]][];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
        </TouchableOpacity>
        <View style={styles.heroCenter}>
          <Text style={styles.heroKicker}>Ajustes</Text>
          <Text style={styles.heroTitle}>Recorrentes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={20} color={C.gold} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Apply banner */}
          <TouchableOpacity style={styles.applyBanner} onPress={handleApply} activeOpacity={0.78}>
            <View style={[styles.applyIconWrap, { backgroundColor: pendingCount > 0 ? C.brand + "18" : C.line + "60" }]}>
              <RefreshCw size={18} color={pendingCount > 0 ? C.brand : C.muted} strokeWidth={2.2} />
            </View>
            <View style={styles.applyBody}>
              <Text style={styles.applyTitle}>Aplicar em {monthName}</Text>
              <Text style={styles.applyMeta}>
                {pendingCount > 0
                  ? `${pendingCount} recorrente${pendingCount !== 1 ? "s" : ""} pendente${pendingCount !== 1 ? "s" : ""}`
                  : "Todos já aplicados este mês"}
              </Text>
            </View>
            <ChevronRight size={16} color={pendingCount > 0 ? C.brand : C.subtle} />
          </TouchableOpacity>

          <Text style={styles.slab}>
            {recurringTransactions.length} recorrente{recurringTransactions.length !== 1 ? "s" : ""} cadastrado{recurringTransactions.length !== 1 ? "s" : ""}
          </Text>

          {recurringTransactions.length === 0 ? (
            <View style={styles.empty}>
              <RefreshCw size={32} color={C.line} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Nenhum recorrente</Text>
              <Text style={styles.emptyText}>Adicione lançamentos que se repetem todo mês, como salário, aluguel ou assinaturas.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {recurringTransactions.map((r, idx) => {
                const col = typeColor(r.type);
                const applied = r.lastAppliedMonth === currentMonth;
                return (
                  <View key={r.id} style={[styles.row, idx === recurringTransactions.length - 1 && styles.rowLast]}>
                    <View style={[styles.typePill, { backgroundColor: col + "18" }]}>
                      <Text style={[styles.typePillText, { color: col }]}>{typeLabel(r.type).slice(0, 3).toUpperCase()}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowDesc} numberOfLines={1}>{r.description}</Text>
                      <Text style={styles.rowMeta}>
                        Dia {r.dayOfMonth} · R$ {r.amount.toFixed(2).replace(".", ",")}
                        {applied ? " · ✓ Aplicado" : ""}
                      </Text>
                    </View>
                    <Switch
                      value={r.isActive}
                      onValueChange={() => toggleRecurring(r.id)}
                      trackColor={{ false: C.line, true: C.brand }}
                      ios_backgroundColor={C.line}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <TouchableOpacity style={styles.delBtn} onPress={() => confirmDelete(r.id, r.description)}>
                      <Trash2 size={14} color={C.expense + "bb"} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.addRowBtn} onPress={openAdd}>
            <Plus size={16} color={C.brand} strokeWidth={2.5} />
            <Text style={styles.addRowBtnText}>Adicionar recorrente</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Recorrentes são lançamentos que se repetem mensalmente. Use "Aplicar" para criá-los automaticamente no mês atual.
          </Text>
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Novo recorrente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Tipo */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.typeChip, draft.type === opt.key && { backgroundColor: opt.color, borderColor: opt.color }]}
                    onPress={() => setDraft((d) => ({ ...d, type: opt.key, category: "" }))}
                  >
                    <Text style={[styles.typeChipText, draft.type === opt.key && { color: "#fff" }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Descrição e valor */}
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 2 }]}>
                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={draft.description}
                  onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
                  placeholder="Ex: Aluguel, Netflix"
                  placeholderTextColor={C.subtle}
                  autoCapitalize="sentences"
                  maxLength={40}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Valor (R$)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={draft.amount}
                  onChangeText={(v) => setDraft((d) => ({ ...d, amount: v }))}
                  placeholder="0,00"
                  placeholderTextColor={C.subtle}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Categoria */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {cats.map(([slug, label]) => (
                  <TouchableOpacity
                    key={slug}
                    style={[styles.catChip, (draft.category === slug || (!draft.category && slug === cats[0]?.[0])) && styles.catChipActive]}
                    onPress={() => setDraft((d) => ({ ...d, category: slug }))}
                  >
                    <Text style={[styles.catChipText, (draft.category === slug || (!draft.category && slug === cats[0]?.[0])) && styles.catChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Conta e dia */}
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 2 }]}>
                <Text style={styles.fieldLabel}>Conta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {settings.accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc}
                      style={[styles.catChip, (draft.account === acc || (!draft.account && acc === settings.accounts[0])) && styles.catChipActive]}
                      onPress={() => setDraft((d) => ({ ...d, account: acc }))}
                    >
                      <Text style={[styles.catChipText, (draft.account === acc || (!draft.account && acc === settings.accounts[0])) && styles.catChipTextActive]}>
                        {acc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Dia do mês</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={draft.dayOfMonth}
                  onChangeText={(v) => setDraft((d) => ({ ...d, dayOfMonth: v }))}
                  placeholder="5"
                  placeholderTextColor={C.subtle}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveDraft}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Adicionar recorrente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { backgroundColor: C.panelAlt },
  hero: { backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, flexDirection: "row", alignItems: "center" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,.12)", alignItems: "center", justifyContent: "center" },
  heroCenter: { flex: 1, alignItems: "center" },
  heroKicker: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,.1)", alignItems: "center", justifyContent: "center" },

  content: { padding: 16, gap: 12 },

  applyBanner: {
    backgroundColor: C.panel,
    borderRadius: R.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...S.soft,
  },
  applyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  applyBody: { flex: 1 },
  applyTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  applyMeta: { fontSize: 12, color: C.muted, marginTop: 2 },

  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },

  empty: { backgroundColor: C.panel, borderRadius: R.lg, padding: 32, alignItems: "center", gap: 10, ...S.soft },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text },
  emptyText: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19 },

  list: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderBottomWidth: 0.5, borderBottomColor: C.line },
  rowLast: { borderBottomWidth: 0 },
  typePill: { width: 40, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  typePillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  rowBody: { flex: 1 },
  rowDesc: { fontSize: 14, fontWeight: "600", color: C.text },
  rowMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  delBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.expense + "12", alignItems: "center", justifyContent: "center" },

  addRowBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.panel, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.brand + "30", borderStyle: "dashed", ...S.soft },
  addRowBtnText: { fontSize: 14, fontWeight: "700", color: C.brand },
  hint: { fontSize: 12, color: C.subtle, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },

  overlay: { flex: 1, backgroundColor: "rgba(7,17,31,.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 0 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center" },

  field: { marginBottom: 14 },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.3 },
  fieldInput: { borderWidth: 1.5, borderColor: C.line, borderRadius: R.md, padding: 12, fontSize: 15, color: C.text, backgroundColor: C.panelAlt },

  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, paddingVertical: 9, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, alignItems: "center", backgroundColor: C.panelAlt },
  typeChipText: { fontSize: 12, fontWeight: "700", color: C.muted },

  catScroll: { marginTop: 0 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.panelAlt, marginRight: 6 },
  catChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  catChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  catChipTextActive: { color: "#fff" },

  saveBtn: { backgroundColor: C.brand, borderRadius: R.md, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
