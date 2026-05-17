// components/ui/index.tsx
// Componentes base reutilizáveis em todas as telas

import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, type ViewStyle, type TextStyle,
} from "react-native";
import { categoryPalette, fintechTheme } from "./theme";

export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: fintechTheme.colors.brand,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.42,
          fontWeight: "900",
          letterSpacing: 0,
        }}
      >
        F
      </Text>
    </View>
  );
}

// ── Formatador BRL ──────────────────────────────────────────────
const brlFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export const brl = (v: number) => brlFmt.format(v || 0);

// ── Cores de categorias (mesmas do web) ─────────────────────────
export const CAT_COLORS: Record<string, string> = {
  ...categoryPalette,
};

export const CAT_LABELS: Record<string, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  saude: "Saúde",
  lazer: "Lazer",
  educacao: "Educação",
  outros: "Outros",
  salario: "Salário",
  freelance: "Freelance",
  rendimento: "Rendimento",
  "renda-fixa": "Renda fixa",
  acoes: "Ações",
  fundos: "Fundos",
  cripto: "Cripto",
  previdencia: "Previdência",
};

// ── Barra de progresso ──────────────────────────────────────────
export function ProgressBar({
  value, color = fintechTheme.colors.brand, height = 8, style,
}: {
  value: number; color?: string; height?: number; style?: ViewStyle;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={[{ backgroundColor: fintechTheme.colors.line, borderRadius: 99, height, overflow: "hidden" }, style]}>
      <View
        style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: 99 }}
      />
    </View>
  );
}

// ── Chip / Badge ────────────────────────────────────────────────
export function Badge({
  label, color = fintechTheme.colors.brand,
}: {
  label: string; color?: string;
}) {
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: color + "18" }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: "600" },
});

// ── Ícone de categoria ──────────────────────────────────────────
const CAT_EMOJI: Record<string, string> = {
  moradia: "🏠", alimentacao: "🍽️", transporte: "🚗",
  saude: "❤️", lazer: "🎮", educacao: "📚", outros: "📦",
  salario: "💰", freelance: "💻", rendimento: "📈",
  "renda-fixa": "🏦", acoes: "📊", fundos: "💼",
  cripto: "₿", previdencia: "🛡️",
};

export function CatIcon({ slug, size = 40 }: { slug: string; size?: number }) {
  const color = CAT_COLORS[slug] || fintechTheme.colors.muted;
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.28,
      backgroundColor: color + "18",
      alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: size * 0.48 }}>{CAT_EMOJI[slug] || "📦"}</Text>
    </View>
  );
}

// ── Card de saldo ───────────────────────────────────────────────
export function StatCard({
  label, value, color = fintechTheme.colors.text, style,
}: {
  label: string; value: string; color?: string; style?: ViewStyle;
}) {
  return (
    <View style={[statStyles.card, style]}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: fintechTheme.colors.panelAlt, borderRadius: fintechTheme.radius.sm,
    padding: 14, flex: 1,
  },
  label: { fontSize: 11, color: fintechTheme.colors.muted, fontWeight: "500", marginBottom: 4 },
  value: { fontSize: 18, fontWeight: "700" },
});

// ── Botão primário ──────────────────────────────────────────────
export function PrimaryBtn({
  label, onPress, loading, style,
}: {
  label: string; onPress: () => void; loading?: boolean; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[btnStyles.btn, loading && btnStyles.disabled, style]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={btnStyles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  btn: {
    backgroundColor: fintechTheme.colors.brand, borderRadius: fintechTheme.radius.sm,
    padding: 15, alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  text: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

// ── Empty state ─────────────────────────────────────────────────
export function EmptyState({ icon, title, copy }: { icon: string; title: string; copy: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <Text style={emptyStyles.icon}>{icon}</Text>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.copy}>{copy}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  icon: { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  title: { fontSize: 15, fontWeight: "600", color: fintechTheme.colors.text, marginBottom: 6, textAlign: "center" },
  copy: { fontSize: 13, color: fintechTheme.colors.muted, textAlign: "center", lineHeight: 20 },
});

// ── Navegador de mês ────────────────────────────────────────────
const PT_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthNav({
  currentDate, onPrev, onNext, light = false,
}: {
  currentDate: string; onPrev: () => void; onNext: () => void;
  light?: boolean;
}) {
  const d = new Date(currentDate);
  const label = `${PT_MONTHS[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`;
  const isCurrentMonth =
    d.getMonth() === new Date().getMonth() &&
    d.getFullYear() === new Date().getFullYear();

  const fg = light ? "rgba(255,255,255,.9)" : fintechTheme.colors.brand;
  const labelColor = light ? "rgba(255,255,255,.85)" : fintechTheme.colors.text;
  const bg = light ? "rgba(255,255,255,.12)" : fintechTheme.colors.panelAlt;

  return (
    <View style={[mnStyles.row, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={onPrev} style={mnStyles.btn}>
        <Text style={[mnStyles.arrow, { color: fg }]}>‹</Text>
      </TouchableOpacity>
      <Text style={[mnStyles.label, { color: labelColor }]}>{label}</Text>
      <TouchableOpacity
        onPress={onNext}
        style={[mnStyles.btn, isCurrentMonth && mnStyles.btnDisabled]}
        disabled={isCurrentMonth}
      >
        <Text style={[mnStyles.arrow, { color: fg }, isCurrentMonth && { opacity: 0.3 }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const mnStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 4 },
  btn: { paddingHorizontal: 10, paddingVertical: 2 },
  btnDisabled: { opacity: 0.5 },
  arrow: { fontSize: 20, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", minWidth: 90, textAlign: "center" },
});

export { fintechTheme };
