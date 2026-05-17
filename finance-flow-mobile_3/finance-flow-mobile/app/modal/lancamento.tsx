import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Check } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "../../stores/useAppStore";
import { fintechTheme } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import type { TransactionType, PaymentMethod } from "../../types";

type TxType = TransactionType;

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const S = fintechTheme.shadow;

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "pix", label: "Pix" },
  { key: "debit", label: "Débito" },
  { key: "credit", label: "Crédito" },
  { key: "cash", label: "Dinheiro" },
  { key: "transfer", label: "Transfer." },
];

const TYPE_LABELS: Record<TxType, string> = {
  expense: "Gasto",
  income: "Renda",
  investment: "Investimento",
};

const TYPE_COLORS: Record<TxType, string> = {
  expense: C.expense,
  income: C.income,
  investment: C.invest,
};

export default function LancamentoModal() {
  const router = useRouter();
  const { type: paramType } = useLocalSearchParams<{ type?: string }>();
  const { addTransaction, settings } = useAppStore();

  const validTypes: TxType[] = ["expense", "income", "investment"];
  const initialType: TxType = validTypes.includes(paramType as TxType)
    ? (paramType as TxType)
    : "expense";

  const getCats = (t: TxType) =>
    (settings.categories[t] as [string, string, string, ...any[]][]).map(
      ([slug, label, color]) => ({ key: slug, label, color })
    );

  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(() => getCats(initialType)[0]?.key ?? "outros");
  const [account, setAccount] = useState(settings.accounts[0] || "Carteira");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [creditCardId, setCreditCardId] = useState<string>(
    settings.creditCards[0]?.id ?? ""
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const cats = getCats(type);
  const activeColor = TYPE_COLORS[type];

  function changeType(nextType: TxType) {
    setType(nextType);
    setCategory(getCats(nextType)[0]?.key ?? "outros");
  }

  function formatAmount(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseInt(digits, 10) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseAmount(value: string) {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  }

  function submit() {
    const numAmount = parseAmount(amount);
    if (numAmount <= 0) {
      Alert.alert("Valor invalido", "Digite um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Descricao obrigatoria", "Descreva o lancamento.");
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      type,
      amount: numAmount,
      description: description.trim(),
      category,
      account,
      paymentMethod,
      creditCardId: paymentMethod === "credit" ? creditCardId : undefined,
      date,
      notes: notes.trim() || undefined,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });

    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Novo lancamento</Text>
          <Text style={styles.title}>{TYPE_LABELS[type]}</Text>
        </View>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: activeColor }]} onPress={submit}>
          <Check size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.typeCard}>
          {(["expense", "income", "investment"] as TxType[]).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => changeType(item)}
              style={[
                styles.typeBtn,
                type === item && { backgroundColor: TYPE_COLORS[item] },
              ]}
            >
              <Text style={[styles.typeBtnText, type === item && styles.typeBtnTextActive]}>
                {TYPE_LABELS[item]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Valor</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: activeColor }]}
              value={amount}
              onChangeText={(value) => setAmount(formatAmount(value))}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={C.subtle}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Field label="Descricao">
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder={
                type === "income"
                  ? "Ex: Salario maio"
                  : type === "investment"
                    ? "Ex: Aporte Tesouro Direto"
                    : "Ex: Supermercado"
              }
              placeholderTextColor={C.subtle}
              returnKeyType="next"
            />
          </Field>

          <Field label="Categoria">
            <ChipRow items={cats} value={category} onChange={setCategory} />
          </Field>

          <Field label="Conta">
            <ChipRow
              items={settings.accounts.map((acc) => ({ key: acc, label: acc, color: C.ink }))}
              value={account}
              onChange={setAccount}
            />
          </Field>

          {type === "expense" && (
            <Field label="Pagamento">
              <ChipRow
                items={PAYMENT_METHODS.map((m) => ({ key: m.key, label: m.label, color: C.ink }))}
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as PaymentMethod)}
              />
            </Field>
          )}

          {type === "expense" && paymentMethod === "credit" && settings.creditCards.length > 0 && (
            <Field label="Cartão">
              <ChipRow
                items={settings.creditCards.map((c) => ({
                  key: c.id,
                  label: c.name,
                  color: (c as any).color || C.brand2,
                }))}
                value={creditCardId}
                onChange={setCreditCardId}
              />
            </Field>
          )}

          <Field label="Data">
            <DatePicker value={date} onChange={setDate} label="Data do lançamento" />
          </Field>

          <Field label="Observacoes">
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Detalhes opcionais"
              placeholderTextColor={C.subtle}
              multiline
            />
          </Field>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveFull, { backgroundColor: activeColor }]} onPress={submit}>
            <Check size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.saveFullText}>Salvar {TYPE_LABELS[type]}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; color: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[
              styles.catChip,
              active && { backgroundColor: item.color, borderColor: item.color },
            ]}
          >
            <Text style={[styles.catChipText, active && { color: "#fff" }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },
  header: {
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { alignItems: "center" },
  kicker: {
    color: "rgba(255,255,255,.62)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  submitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, backgroundColor: C.panelAlt },
  typeCard: {
    flexDirection: "row",
    gap: 8,
    margin: 16,
    backgroundColor: C.panel,
    borderRadius: R.lg,
    padding: 6,
    ...S.soft,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: R.md,
    alignItems: "center",
  },
  typeBtnText: { fontSize: 13, fontWeight: "800", color: C.muted },
  typeBtnTextActive: { color: "#fff" },
  amountCard: {
    backgroundColor: C.panel,
    marginHorizontal: 16,
    borderRadius: R.lg,
    padding: 18,
    alignItems: "center",
    ...S.soft,
  },
  amountLabel: { fontSize: 12, color: C.muted, fontWeight: "700" },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: "800", color: C.subtle, marginRight: 8 },
  amountInput: {
    fontSize: 48,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    letterSpacing: -1,
  },
  formCard: {
    backgroundColor: C.panel,
    margin: 16,
    borderRadius: R.lg,
    padding: 16,
    ...S.soft,
  },
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "800", color: C.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    padding: 13,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.panelAlt,
  },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  chipScroll: { marginHorizontal: -2 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    marginRight: 8,
    backgroundColor: C.panelAlt,
  },
  catChipText: { fontSize: 13, fontWeight: "700", color: C.muted },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 13,
    backgroundColor: C.panelAlt,
  },
  dateInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.text },
  footer: { paddingHorizontal: 16, paddingBottom: 32 },
  saveFull: {
    borderRadius: R.md,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...S.lift,
  },
  saveFullText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
