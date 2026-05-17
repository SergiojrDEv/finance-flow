import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Check, PiggyBank, Archive } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";

import { useAppStore } from "../../stores/useAppStore";
import { brl, fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const INVEST_CATS = [
  { key: "renda-fixa", label: "Renda fixa", color: C.brand, icon: "RF" },
  { key: "acoes", label: "Ações", color: C.blue, icon: "AC" },
  { key: "fundos", label: "Fundos", color: "#127a8a", icon: "FD" },
  { key: "cripto", label: "Cripto", color: C.warning, icon: "CR" },
  { key: "previdencia", label: "Previdência", color: C.invest, icon: "PV" },
];

function pct(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function RingProgress({
  size,
  stroke,
  progress,
  color,
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 100) / 100);
  const cx = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cx} r={r} stroke="#e2eaf4" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={color} strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
      </Svg>
      {children}
    </View>
  );
}

export default function MetasScreen() {
  const { goals, transactions, addGoal, updateGoal, archiveGoal } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositVal, setDepositVal] = useState("");

  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formKey, setFormKey] = useState("renda-fixa");
  const [formCurrent, setFormCurrent] = useState("");

  const activeGoals = useMemo(
    () => goals.filter((g) => !g.isArchived).sort((a, b) => b.target - a.target),
    [goals]
  );

  const investByKey = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "investment")
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [transactions]);

  const totalTarget = activeGoals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalPct = pct(totalCurrent, totalTarget);

  const mainGoal = activeGoals[0] ?? null;
  const otherGoals = activeGoals.slice(1);

  const tipGoal = useMemo(
    () => activeGoals.find((g) => pct(g.currentAmount, g.target) >= 70 && pct(g.currentAmount, g.target) < 100),
    [activeGoals]
  );

  function submitGoal() {
    if (!formName.trim() || !formTarget) {
      Alert.alert("Atenção", "Preencha nome e valor objetivo.");
      return;
    }
    addGoal({
      id: Date.now().toString(),
      name: formName.trim(),
      target: parseFloat(formTarget),
      currentAmount: parseFloat(formCurrent) || 0,
      key: formKey,
      color: INVEST_CATS.find((c) => c.key === formKey)?.color,
    });
    setFormName(""); setFormTarget(""); setFormCurrent(""); setFormKey("renda-fixa");
    setShowAdd(false);
  }

  function submitDeposit() {
    if (!depositGoalId || !depositVal) return;
    const value = parseFloat(depositVal);
    if (isNaN(value) || value <= 0) { Alert.alert("Valor inválido"); return; }
    const goal = goals.find((g) => g.id === depositGoalId);
    if (goal) updateGoal(depositGoalId, { currentAmount: Math.min(goal.target, goal.currentAmount + value) });
    setDepositGoalId(null); setDepositVal("");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroKicker}>Metas de investimento</Text>
              <Text style={styles.heroTotal}>{brl(totalCurrent)}</Text>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowAdd(true)}>
              <Plus size={16} color={C.brand} strokeWidth={2.5} />
              <Text style={styles.newBtnText}>Nova meta</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""} ativa{activeGoals.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {totalTarget > 0 && (
              <Text style={styles.heroNote}>
                {totalPct}% do total acumulado · objetivo {brl(totalTarget)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {activeGoals.length === 0 ? (
            /* Estado vazio */
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>Nenhuma meta ainda</Text>
              <Text style={styles.emptyCopy}>
                Crie objetivos para reserva, viagem, aposentadoria ou investimentos.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Criar primeira meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── META PRINCIPAL ── */}
              {mainGoal && (() => {
                const config = INVEST_CATS.find((c) => c.key === mainGoal.key);
                const color = mainGoal.color || config?.color || C.invest;
                const progress = pct(mainGoal.currentAmount, mainGoal.target);
                const remaining = mainGoal.target - mainGoal.currentAmount;

                return (
                  <View style={styles.mainCard}>
                    <Text style={styles.slab}>Meta principal</Text>
                    <View style={styles.mainBody}>
                      <RingProgress size={120} stroke={10} progress={progress} color={color}>
                        <View style={styles.ringCenter}>
                          <Text style={[styles.ringPct, { color }]}>{progress}%</Text>
                          <Text style={styles.ringLabel}>concluído</Text>
                        </View>
                      </RingProgress>

                      <View style={styles.mainInfo}>
                        <View style={[styles.catBadge, { backgroundColor: color + "18" }]}>
                          <Text style={[styles.catBadgeText, { color }]}>
                            {config?.icon || "MT"} · {config?.label || "Meta"}
                          </Text>
                        </View>
                        <Text style={styles.mainName}>{mainGoal.name}</Text>
                        <Text style={styles.mainCurrent}>{brl(mainGoal.currentAmount)}</Text>
                        <Text style={styles.mainTarget}>de {brl(mainGoal.target)}</Text>
                        {remaining > 0 && (
                          <Text style={styles.mainRemain}>
                            Faltam {brl(remaining)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.mainActions}>
                      <TouchableOpacity
                        style={[styles.depositBtn, { borderColor: color, backgroundColor: color + "12" }]}
                        onPress={() => { setDepositGoalId(mainGoal.id || null); setDepositVal(""); }}
                      >
                        <PiggyBank size={14} color={color} />
                        <Text style={[styles.depositBtnText, { color }]}>Depositar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.archiveBtn}
                        onPress={() => Alert.alert("Arquivar meta", "Deseja arquivar?", [
                          { text: "Cancelar", style: "cancel" },
                          { text: "Arquivar", onPress: () => archiveGoal(mainGoal.id!) },
                        ])}
                      >
                        <Archive size={14} color={C.subtle} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}

              {/* ── OUTRAS METAS ── */}
              {otherGoals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.slab}>Outras metas</Text>
                  <View style={styles.grid}>
                    {otherGoals.map((goal) => {
                      const config = INVEST_CATS.find((c) => c.key === goal.key);
                      const color = goal.color || config?.color || C.invest;
                      const progress = pct(goal.currentAmount, goal.target);
                      const done = progress >= 100;

                      return (
                        <TouchableOpacity
                          key={goal.id}
                          style={styles.gridCard}
                          onPress={() => { setDepositGoalId(goal.id || null); setDepositVal(""); }}
                          activeOpacity={0.78}
                        >
                          <RingProgress size={76} stroke={7} progress={progress} color={done ? C.success : color}>
                            <Text style={[styles.gridPct, { color: done ? C.success : color }]}>
                              {progress}%
                            </Text>
                          </RingProgress>
                          <Text style={styles.gridName} numberOfLines={2}>{goal.name}</Text>
                          <Text style={styles.gridSub}>
                            {brl(goal.currentAmount)}{"\n"}{brl(goal.target)}
                          </Text>
                          {done && (
                            <View style={styles.donePill}>
                              <Text style={styles.donePillText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── DICA INTELIGENTE ── */}
              {tipGoal && (
                <View style={styles.tipCard}>
                  <Text style={styles.tipIcon}>🎯</Text>
                  <View style={styles.tipBody}>
                    <Text style={styles.tipTitle}>{tipGoal.name} quase lá!</Text>
                    <Text style={styles.tipCopy}>
                      Faltam {brl(tipGoal.target - tipGoal.currentAmount)} para concluir este objetivo.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <DepositModal
        visible={depositGoalId !== null}
        title={goals.find((g) => g.id === depositGoalId)?.name || ""}
        value={depositVal}
        onChange={setDepositVal}
        onClose={() => setDepositGoalId(null)}
        onSubmit={submitDeposit}
      />

      <GoalModal
        visible={showAdd}
        formName={formName} formTarget={formTarget} formCurrent={formCurrent} formKey={formKey}
        onClose={() => setShowAdd(false)} onSubmit={submitGoal}
        setFormName={setFormName} setFormTarget={setFormTarget}
        setFormCurrent={setFormCurrent} setFormKey={setFormKey}
      />
    </SafeAreaView>
  );
}

function DepositModal({ visible, title, value, onChange, onClose, onSubmit }: {
  visible: boolean; title: string; value: string;
  onChange: (v: string) => void; onClose: () => void; onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ModalHeader title="Registrar depósito" onClose={onClose} />
          <Text style={styles.modalSub}>{title}</Text>
          <TextInput
            style={styles.fieldInput} value={value} onChangeText={onChange}
            keyboardType="numeric" placeholder="Valor depositado"
            placeholderTextColor={C.subtle} autoFocus
          />
          <SaveButton label="Confirmar" onPress={onSubmit} />
        </View>
      </View>
    </Modal>
  );
}

function GoalModal({ visible, formName, formTarget, formCurrent, formKey, onClose, onSubmit,
  setFormName, setFormTarget, setFormCurrent, setFormKey }: {
  visible: boolean; formName: string; formTarget: string; formCurrent: string; formKey: string;
  onClose: () => void; onSubmit: () => void;
  setFormName: (v: string) => void; setFormTarget: (v: string) => void;
  setFormCurrent: (v: string) => void; setFormKey: (v: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <ModalHeader title="Nova meta" onClose={onClose} />
          <Field label="Nome da meta">
            <TextInput style={styles.fieldInput} value={formName} onChangeText={setFormName}
              placeholder="Ex: Reserva de emergência" placeholderTextColor={C.subtle} />
          </Field>
          <Field label="Objetivo (R$)">
            <TextInput style={styles.fieldInput} value={formTarget} onChangeText={setFormTarget}
              keyboardType="numeric" placeholder="30000" placeholderTextColor={C.subtle} />
          </Field>
          <Field label="Já guardado (R$)">
            <TextInput style={styles.fieldInput} value={formCurrent} onChangeText={setFormCurrent}
              keyboardType="numeric" placeholder="0" placeholderTextColor={C.subtle} />
          </Field>
          <Field label="Categoria">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPillRow}>
              {INVEST_CATS.map((cat) => (
                <TouchableOpacity
                  key={cat.key} onPress={() => setFormKey(cat.key)}
                  style={[styles.catPill, formKey === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                >
                  <Text style={[styles.catPillText, formKey === cat.key && { color: "#fff" }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
          <SaveButton label="Criar meta" onPress={onSubmit} />
        </View>
      </View>
    </Modal>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.modalClose}>
        <X size={20} color={C.muted} />
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SaveButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.saveBtn} onPress={onPress}>
      <Check size={18} color="#fff" />
      <Text style={styles.saveBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.panelAlt },

  // Hero
  hero: { backgroundColor: C.brand, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 12 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroKicker: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTotal: { fontSize: 34, fontWeight: "900", color: "#fff", marginTop: 4, letterSpacing: -1 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.gold, borderRadius: R.pill,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  newBtnText: { fontSize: 12, fontWeight: "800", color: C.brand },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroBadge: { backgroundColor: "rgba(255,255,255,.14)", borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.8)" },
  heroNote: { fontSize: 11, color: "rgba(255,255,255,.45)", flex: 1 },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 },
  section: { gap: 0 },

  // Main goal card
  mainCard: { backgroundColor: C.panel, borderRadius: R.lg, padding: 18, gap: 18, ...S.soft },
  mainBody: { flexDirection: "row", gap: 18, alignItems: "center" },
  ringCenter: { alignItems: "center", gap: 2 },
  ringPct: { fontSize: 20, fontWeight: "900" },
  ringLabel: { fontSize: 9, fontWeight: "700", color: C.muted, textTransform: "uppercase" },
  mainInfo: { flex: 1, gap: 4 },
  catBadge: { alignSelf: "flex-start", borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: "800" },
  mainName: { fontSize: 16, fontWeight: "800", color: C.text },
  mainCurrent: { fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
  mainTarget: { fontSize: 12, color: C.subtle },
  mainRemain: { fontSize: 12, fontWeight: "700", color: C.muted },
  mainActions: { flexDirection: "row", gap: 8 },
  depositBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1.5, borderRadius: R.md, paddingVertical: 11,
  },
  depositBtnText: { fontSize: 13, fontWeight: "800" },
  archiveBtn: { padding: 11, borderWidth: 1, borderColor: C.line, borderRadius: R.md, backgroundColor: C.panelAlt },

  // Grid (other goals)
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCard: {
    width: "30.5%", backgroundColor: C.panel, borderRadius: R.md, padding: 12,
    alignItems: "center", gap: 8, ...S.soft, position: "relative",
  },
  gridPct: { fontSize: 14, fontWeight: "900" },
  gridName: { fontSize: 11, fontWeight: "700", color: C.text, textAlign: "center" },
  gridSub: { fontSize: 10, color: C.subtle, textAlign: "center", lineHeight: 15 },
  donePill: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.success, alignItems: "center", justifyContent: "center",
  },
  donePillText: { fontSize: 9, fontWeight: "900", color: "#fff" },

  // Tip card
  tipCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: "#ecfdf5", borderRadius: R.md, padding: 14,
    borderLeftWidth: 3, borderLeftColor: C.success,
  },
  tipIcon: { fontSize: 22 },
  tipBody: { flex: 1, gap: 3 },
  tipTitle: { fontSize: 14, fontWeight: "800", color: "#065f46" },
  tipCopy: { fontSize: 12, color: "#047857", lineHeight: 18 },

  // Empty
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: C.text, textAlign: "center" },
  emptyCopy: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.brand, borderRadius: R.pill, paddingHorizontal: 18, paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  bottomSpacer: { height: 110 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(7,17,31,.62)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.panel, borderRadius: 28, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 22 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: C.text },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center" },
  modalSub: { fontSize: 13, color: C.muted, marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: C.muted, fontWeight: "800", marginBottom: 7 },
  fieldInput: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 13, fontSize: 15, color: C.text, backgroundColor: C.panelAlt },
  saveBtn: { backgroundColor: C.brand, borderRadius: R.md, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  catPillRow: { marginTop: 4 },
  catPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.panelAlt, marginRight: 8 },
  catPillText: { fontSize: 12, fontWeight: "800", color: C.muted },
});
