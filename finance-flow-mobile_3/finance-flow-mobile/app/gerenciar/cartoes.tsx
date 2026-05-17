import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, TextInput, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Trash2, CreditCard, Check, X, FileText } from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const CARD_COLORS = ["#0d1e35", "#635bff", "#168a5b", "#c43d4b", "#f08c00", "#127a8a"];

interface CardDraft {
  name: string;
  closingDay: string;
  dueDay: string;
  color: string;
}

const emptyDraft = (): CardDraft => ({ name: "", closingDay: "25", dueDay: "10", color: CARD_COLORS[0] });

export default function CartoesScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useAppStore();
  const cards = settings.creditCards;

  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<CardDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  function openAdd() {
    setDraft(emptyDraft());
    setEditingId(null);
    setModalVisible(true);
  }

  function openEdit(card: typeof cards[0]) {
    setDraft({ name: card.name, closingDay: String(card.closingDay), dueDay: String(card.dueDay), color: (card as any).color || CARD_COLORS[0] });
    setEditingId(card.id);
    setModalVisible(true);
  }

  function saveCard() {
    const name = draft.name.trim();
    if (!name) { Alert.alert("Nome obrigatório", "Dê um nome ao cartão."); return; }
    const closing = parseInt(draft.closingDay) || 25;
    const due = parseInt(draft.dueDay) || 10;
    if (closing < 1 || closing > 28 || due < 1 || due > 28) {
      Alert.alert("Dia inválido", "Os dias devem ser entre 1 e 28.");
      return;
    }

    if (editingId) {
      const updated = cards.map((c) =>
        c.id === editingId ? { ...c, name, closingDay: closing, dueDay: due, color: draft.color } : c
      );
      updateSettings({ creditCards: updated });
    } else {
      updateSettings({
        creditCards: [...cards, { id: Date.now().toString(), name, closingDay: closing, dueDay: due }],
      });
    }
    setModalVisible(false);
  }

  function deleteCard(id: string) {
    if (cards.length === 1) {
      Alert.alert("Não permitido", "Mantenha pelo menos um cartão cadastrado.");
      return;
    }
    Alert.alert("Remover cartão", "Deseja remover este cartão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => updateSettings({ creditCards: cards.filter((c) => c.id !== id) }) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
        </TouchableOpacity>
        <View style={styles.heroCenter}>
          <Text style={styles.heroKicker}>Ajustes</Text>
          <Text style={styles.heroTitle}>Cartões de crédito</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={20} color={C.gold} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.slab}>{cards.length} cartão{cards.length !== 1 ? "ões" : ""} cadastrado{cards.length !== 1 ? "s" : ""}</Text>

          <View style={styles.list}>
            {cards.map((card, idx) => (
              <View key={card.id} style={[styles.row, idx === cards.length - 1 && styles.rowLast]}>
                {/* Mini card visual */}
                <View style={[styles.cardVisual, { backgroundColor: (card as any).color || C.brand2 }]}>
                  <CreditCard size={16} color="rgba(255,255,255,.7)" strokeWidth={1.8} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardMeta}>
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                  </Text>
                </View>
                <TouchableOpacity style={styles.faturaBtn} onPress={() => router.push(`/gerenciar/fatura?cardId=${card.id}`)}>
                  <FileText size={13} color={C.invest} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(card)}>
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => deleteCard(card.id)}>
                  <Trash2 size={14} color={C.expense + "bb"} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.addRowBtn} onPress={openAdd}>
            <Plus size={16} color={C.brand} strokeWidth={2.5} />
            <Text style={styles.addRowBtnText}>Adicionar cartão</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Os dias de fechamento e vencimento ajudam a organizar gastos no cartão de crédito dentro do ciclo correto.
          </Text>
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {/* Modal de edição */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingId ? "Editar cartão" : "Novo cartão"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome do cartão</Text>
              <TextInput
                style={styles.fieldInput}
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder="Ex: Nubank, Itaú Platinum"
                placeholderTextColor={C.subtle}
                autoCapitalize="words"
                maxLength={32}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Dia de fechamento</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={draft.closingDay}
                  onChangeText={(v) => setDraft((d) => ({ ...d, closingDay: v }))}
                  placeholder="25"
                  placeholderTextColor={C.subtle}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Dia de vencimento</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={draft.dueDay}
                  onChangeText={(v) => setDraft((d) => ({ ...d, dueDay: v }))}
                  placeholder="10"
                  placeholderTextColor={C.subtle}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Cor do cartão</Text>
              <View style={styles.colorRow}>
                {CARD_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    onPress={() => setDraft((d) => ({ ...d, color: col }))}
                    style={[styles.colorSwatch, { backgroundColor: col }, draft.color === col && styles.colorSwatchActive]}
                  >
                    {draft.color === col && <Check size={14} color="#fff" strokeWidth={3} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveCard}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{editingId ? "Salvar alterações" : "Adicionar cartão"}</Text>
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
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  list: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderBottomWidth: 0.5, borderBottomColor: C.line },
  rowLast: { borderBottomWidth: 0 },
  cardVisual: { width: 42, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600", color: C.text },
  cardMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  faturaBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.invest + "14", alignItems: "center", justifyContent: "center" },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.panelAlt, borderRadius: R.sm },
  editBtnText: { fontSize: 12, fontWeight: "700", color: C.brand },
  delBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.expense + "12", alignItems: "center", justifyContent: "center" },

  addRowBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.panel, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.brand + "30", borderStyle: "dashed", ...S.soft },
  addRowBtnText: { fontSize: 14, fontWeight: "700", color: C.brand },
  hint: { fontSize: 12, color: C.subtle, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },

  overlay: { flex: 1, backgroundColor: "rgba(7,17,31,.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 0 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center" },
  field: { marginBottom: 16 },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.3 },
  fieldInput: { borderWidth: 1.5, borderColor: C.line, borderRadius: R.md, padding: 13, fontSize: 15, color: C.text, backgroundColor: C.panelAlt },
  colorRow: { flexDirection: "row", gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorSwatchActive: { borderWidth: 2.5, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  saveBtn: { backgroundColor: C.brand, borderRadius: R.md, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
