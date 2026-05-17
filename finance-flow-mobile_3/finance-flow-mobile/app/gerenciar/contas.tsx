import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

export default function ContasScreen() {
  const router = useRouter();
  const { settings, updateSettings, transactions } = useAppStore();
  const accounts = settings.accounts;

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const inputRef = useRef<TextInput>(null);

  function txCount(name: string) {
    return transactions.filter((t) => t.account === name).length;
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(accounts[idx]);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed) { cancelEdit(); return; }
    if (accounts.includes(trimmed) && trimmed !== accounts[editingIdx!]) {
      Alert.alert("Já existe", "Você já tem uma conta com esse nome.");
      return;
    }
    const updated = accounts.map((a, i) => i === editingIdx ? trimmed : a);
    updateSettings({ accounts: updated });
    setEditingIdx(null);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditValue("");
  }

  function deleteAccount(idx: number) {
    if (accounts.length === 1) {
      Alert.alert("Não permitido", "O app precisa ter pelo menos uma conta.");
      return;
    }
    const name = accounts[idx];
    const count = txCount(name);
    Alert.alert(
      `Remover "${name}"`,
      count > 0
        ? `Esta conta tem ${count} lançamento${count !== 1 ? "s" : ""}. Eles serão mantidos mas ficarão sem conta vinculada.`
        : "Tem certeza que deseja remover esta conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => updateSettings({ accounts: accounts.filter((_, i) => i !== idx) }),
        },
      ]
    );
  }

  function addAccount() {
    const trimmed = newAccount.trim();
    if (!trimmed) return;
    if (accounts.includes(trimmed)) {
      Alert.alert("Já existe", "Você já tem uma conta com esse nome.");
      return;
    }
    updateSettings({ accounts: [...accounts, trimmed] });
    setNewAccount("");
    setAddingNew(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <Text style={styles.heroKicker}>Ajustes</Text>
            <Text style={styles.heroTitle}>Minhas contas</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setAddingNew(true); setTimeout(() => inputRef.current?.focus(), 80); }}
          >
            <Plus size={20} color={C.gold} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.slab}>{accounts.length} conta{accounts.length !== 1 ? "s" : ""} configurada{accounts.length !== 1 ? "s" : ""}</Text>

            <View style={styles.list}>
              {accounts.map((acc, idx) => {
                const count = txCount(acc);
                const isEditing = editingIdx === idx;
                return (
                  <View key={idx} style={[styles.row, idx === accounts.length - 1 && !addingNew && styles.rowLast]}>
                    {/* Ícone */}
                    <View style={styles.rowIcon}>
                      <Text style={styles.rowIconText}>{acc.charAt(0).toUpperCase()}</Text>
                    </View>

                    {/* Nome / Input */}
                    <View style={styles.rowBody}>
                      {isEditing ? (
                        <TextInput
                          ref={inputRef}
                          style={styles.rowInput}
                          value={editValue}
                          onChangeText={setEditValue}
                          onSubmitEditing={saveEdit}
                          returnKeyType="done"
                          autoCapitalize="words"
                          maxLength={32}
                        />
                      ) : (
                        <>
                          <Text style={styles.rowName}>{acc}</Text>
                          {count > 0 && (
                            <Text style={styles.rowCount}>{count} lançamento{count !== 1 ? "s" : ""}</Text>
                          )}
                        </>
                      )}
                    </View>

                    {/* Ações */}
                    {isEditing ? (
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.actionCheck} onPress={saveEdit}>
                          <Check size={16} color="#fff" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCancel} onPress={cancelEdit}>
                          <X size={16} color={C.muted} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.actionEdit} onPress={() => startEdit(idx)}>
                          <Pencil size={14} color={C.muted} strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionDel} onPress={() => deleteAccount(idx)}>
                          <Trash2 size={14} color={C.expense + "bb"} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Nova conta inline */}
              {addingNew && (
                <View style={[styles.row, styles.rowLast]}>
                  <View style={[styles.rowIcon, { backgroundColor: C.gold + "22" }]}>
                    <Plus size={16} color={C.gold} strokeWidth={2.5} />
                  </View>
                  <View style={styles.rowBody}>
                    <TextInput
                      ref={addingNew ? inputRef : undefined}
                      style={styles.rowInput}
                      value={newAccount}
                      onChangeText={setNewAccount}
                      placeholder="Nome da nova conta"
                      placeholderTextColor={C.subtle}
                      onSubmitEditing={addAccount}
                      returnKeyType="done"
                      autoCapitalize="words"
                      maxLength={32}
                      autoFocus
                    />
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={[styles.actionCheck, !newAccount.trim() && { opacity: 0.4 }]}
                      onPress={addAccount}
                      disabled={!newAccount.trim()}
                    >
                      <Check size={16} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionCancel}
                      onPress={() => { setAddingNew(false); setNewAccount(""); }}
                    >
                      <X size={16} color={C.muted} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {!addingNew && (
              <TouchableOpacity
                style={styles.addRowBtn}
                onPress={() => { setAddingNew(true); }}
              >
                <Plus size={16} color={C.brand} strokeWidth={2.5} />
                <Text style={styles.addRowBtnText}>Adicionar conta</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.hint}>
              Contas organizam seus lançamentos. Você pode ter contas de banco, carteira física, corretora, etc.
            </Text>
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,.1)",
    alignItems: "center", justifyContent: "center",
  },

  content: { padding: 16, gap: 12 },
  slab: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },

  list: { backgroundColor: C.panel, borderRadius: R.lg, overflow: "hidden", ...S.soft },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.brand + "14",
    alignItems: "center", justifyContent: "center",
  },
  rowIconText: { fontSize: 16, fontWeight: "800", color: C.brand },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: "600", color: C.text },
  rowCount: { fontSize: 11, color: C.muted, marginTop: 2 },
  rowInput: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    borderBottomWidth: 1.5,
    borderBottomColor: C.brand,
    paddingVertical: 2,
  },
  rowActions: { flexDirection: "row", gap: 6 },
  actionEdit: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.panelAlt,
    alignItems: "center", justifyContent: "center",
  },
  actionDel: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.expense + "12",
    alignItems: "center", justifyContent: "center",
  },
  actionCheck: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.income,
    alignItems: "center", justifyContent: "center",
  },
  actionCancel: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.panelAlt,
    alignItems: "center", justifyContent: "center",
  },

  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.panel,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.brand + "30",
    borderStyle: "dashed",
    ...S.soft,
  },
  addRowBtnText: { fontSize: 14, fontWeight: "700", color: C.brand },

  hint: { fontSize: 12, color: C.subtle, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },
});
