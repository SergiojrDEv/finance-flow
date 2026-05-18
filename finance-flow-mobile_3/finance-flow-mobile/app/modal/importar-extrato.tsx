import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { X, Upload, Check, AlertCircle, FileText } from "lucide-react-native";
import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme, brl } from "../../components/ui";
import { parseCSV, parseOFX, parsedToTransactions, ParsedRow } from "../../lib/importParser";
import type { Transaction } from "../../types";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  income:     { label: "Receita",      color: C.income },
  expense:    { label: "Despesa",      color: C.expense },
  investment: { label: "Investimento", color: C.gold },
};

export default function ImportarExtratoModal() {
  const router = useRouter();
  const { addTransaction, settings } = useAppStore();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "application/octet-stream", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setLoading(true);
      setFileName(asset.name);

      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const ext = asset.name.toLowerCase();
      let parsed: ParsedRow[] = [];

      if (ext.endsWith(".ofx") || ext.endsWith(".qfx")) {
        parsed = parseOFX(content);
      } else {
        parsed = parseCSV(content);
      }

      if (parsed.length === 0) {
        Alert.alert("Arquivo não reconhecido", "Não foi possível encontrar transações neste arquivo. Verifique se é um CSV ou OFX válido.");
      } else {
        setRows(parsed);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível ler o arquivo.");
    } finally {
      setLoading(false);
    }
  }

  function toggleType(idx: number) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, type: r.type === "expense" ? "income" : "expense" } : r
      )
    );
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function confirmImport() {
    const account = settings.accounts?.[0] || "Conta corrente";
    const txs: Transaction[] = parsedToTransactions(rows, account);
    txs.forEach((tx) => addTransaction(tx));
    setImported(true);
  }

  const totalIncome  = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  if (imported) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Check size={40} color={C.income} strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>{rows.length} transações importadas!</Text>
          <Text style={styles.successSub}>Já aparecem na sua carteira.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Importar extrato</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={C.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Picker */}
        <TouchableOpacity style={styles.pickerCard} onPress={pickFile} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={C.gold} />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <Upload size={28} color={C.gold} strokeWidth={2} />
              </View>
              <Text style={styles.pickerTitle}>
                {fileName || "Selecionar arquivo"}
              </Text>
              <Text style={styles.pickerSub}>CSV ou OFX · Nubank, Itaú, Bradesco, BB...</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Instrução */}
        {rows.length === 0 && !loading && (
          <View style={styles.infoBox}>
            <AlertCircle size={16} color={C.gold} strokeWidth={2} />
            <Text style={styles.infoText}>
              Exporte o extrato no app do seu banco (geralmente em Extrato → Exportar → CSV/OFX) e selecione o arquivo aqui.
            </Text>
          </View>
        )}

        {/* Resumo */}
        {rows.length > 0 && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Encontradas</Text>
                <Text style={styles.summaryValue}>{rows.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: C.income + "cc" }]}>Receitas</Text>
                <Text style={[styles.summaryValue, { color: C.income }]}>{brl(totalIncome)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: C.expense + "cc" }]}>Despesas</Text>
                <Text style={[styles.summaryValue, { color: C.expense }]}>{brl(totalExpense)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Prévia — toque para ajustar</Text>

            {rows.map((row, idx) => (
              <View key={idx} style={styles.rowCard}>
                <View style={styles.rowLeft}>
                  <TouchableOpacity
                    style={[styles.typeBadge, { backgroundColor: TYPE_LABEL[row.type]?.color + "22" }]}
                    onPress={() => toggleType(idx)}
                  >
                    <Text style={[styles.typeBadgeText, { color: TYPE_LABEL[row.type]?.color }]}>
                      {TYPE_LABEL[row.type]?.label}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowDesc} numberOfLines={1}>{row.description}</Text>
                    <Text style={styles.rowDate}>{row.date} · {row.category}</Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowAmount, { color: row.type === "income" ? C.income : C.expense }]}>
                    {row.type === "income" ? "+" : "-"}{brl(row.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => removeRow(idx)} style={styles.removeBtn}>
                    <X size={14} color={C.muted} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA fixo */}
      {rows.length > 0 && (
        <View style={styles.cta}>
          <TouchableOpacity style={styles.importBtn} onPress={confirmImport}>
            <FileText size={18} color={C.brand} strokeWidth={2.5} />
            <Text style={styles.importBtnText}>Importar {rows.length} transações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRows([]); setFileName(""); }}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.panelAlt },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.line,
    backgroundColor: C.panel,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center",
  },

  content: { paddingHorizontal: 16, paddingTop: 20 },

  pickerCard: {
    backgroundColor: C.panel, borderRadius: R.lg, borderWidth: 1.5,
    borderColor: C.gold + "55", borderStyle: "dashed",
    padding: 28, alignItems: "center", gap: 10, marginBottom: 16,
    ...S.soft,
  },
  uploadIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: C.gold + "18", alignItems: "center", justifyContent: "center",
  },
  pickerTitle: { fontSize: 15, fontWeight: "700", color: C.text, textAlign: "center" },
  pickerSub: { fontSize: 12, color: C.muted, textAlign: "center" },

  infoBox: {
    flexDirection: "row", gap: 10, backgroundColor: C.gold + "12",
    borderRadius: R.md, padding: 14, alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, color: C.muted, lineHeight: 19 },

  summaryRow: {
    flexDirection: "row", backgroundColor: C.panel, borderRadius: R.md,
    padding: 14, marginBottom: 20, ...S.soft,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 10, fontWeight: "700", color: C.muted, textTransform: "uppercase" },
  summaryValue: { fontSize: 14, fontWeight: "800", color: C.text },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10,
  },

  rowCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.panel, borderRadius: R.md, padding: 12,
    marginBottom: 8, ...S.soft,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: "800" },
  rowDesc: { fontSize: 13, fontWeight: "600", color: C.text },
  rowDate: { fontSize: 11, color: C.muted, marginTop: 2 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowAmount: { fontSize: 13, fontWeight: "800" },
  removeBtn: { padding: 4 },

  cta: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.panel, borderTopWidth: 1, borderTopColor: C.line,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 8,
  },
  importBtn: {
    backgroundColor: C.gold, borderRadius: R.md, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  importBtnText: { fontSize: 15, fontWeight: "800", color: C.brand },
  cancelBtn: { alignItems: "center", paddingVertical: 6 },
  cancelBtnText: { fontSize: 13, color: C.muted, fontWeight: "600" },

  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.income + "18", alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.text, textAlign: "center" },
  successSub: { fontSize: 14, color: C.muted, textAlign: "center" },
  doneBtn: {
    marginTop: 16, backgroundColor: C.gold, borderRadius: R.md,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  doneBtnText: { fontSize: 15, fontWeight: "800", color: C.brand },
});
