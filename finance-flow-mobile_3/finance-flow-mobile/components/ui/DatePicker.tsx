import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
} from "react-native";
import { Calendar, Check, X } from "lucide-react-native";
import { fintechTheme } from "./index";

const C = fintechTheme.colors;
const R = fintechTheme.radius;

const PT_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PT_MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y || new Date().getFullYear(), month: m || new Date().getMonth() + 1, day: d || new Date().getDate() };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

interface Props {
  value: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label = "Data" }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = parseIso(value);
  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);

  function openPicker() {
    const p = parseIso(value);
    setYear(p.year);
    setMonth(p.month);
    setDay(p.day);
    setOpen(true);
  }

  function confirm() {
    const safeDay = Math.min(day, daysInMonth(year, month));
    onChange(`${year}-${pad(month)}-${pad(safeDay)}`);
    setOpen(false);
  }

  const displayDate = (() => {
    const p = parseIso(value);
    if (!p.year) return "Selecionar data";
    return `${p.day} ${PT_MONTHS_SHORT[p.month - 1]} ${p.year}`;
  })();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const months = PT_MONTHS.map((label, i) => ({ label, value: i + 1 }));

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openPicker} activeOpacity={0.75}>
        <Calendar size={16} color={C.subtle} />
        <Text style={styles.triggerText}>{displayDate}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <X size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.columns}>
              {/* Day */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>Dia</Text>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.item, day === d && styles.itemActive]}
                      onPress={() => setDay(d)}
                    >
                      <Text style={[styles.itemText, day === d && styles.itemTextActive]}>
                        {pad(d)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View style={[styles.col, { flex: 2 }]}>
                <Text style={styles.colLabel}>Mês</Text>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {months.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      style={[styles.item, month === m.value && styles.itemActive]}
                      onPress={() => setMonth(m.value)}
                    >
                      <Text style={[styles.itemText, month === m.value && styles.itemTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>Ano</Text>
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.item, year === y && styles.itemActive]}
                      onPress={() => setYear(y)}
                    >
                      <Text style={[styles.itemText, year === y && styles.itemTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
              <Check size={18} color="#fff" />
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 13,
    paddingVertical: 13,
    backgroundColor: C.panelAlt,
  },
  triggerText: { flex: 1, fontSize: 15, color: C.text },

  overlay: { flex: 1, backgroundColor: "rgba(7,17,31,.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.panelAlt, alignItems: "center", justifyContent: "center" },

  columns: { flexDirection: "row", gap: 8, height: 200 },
  col: { flex: 1 },
  colLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center", marginBottom: 6 },
  scroll: { flex: 1 },
  item: { paddingVertical: 9, paddingHorizontal: 6, borderRadius: R.sm, marginBottom: 2, alignItems: "center" },
  itemActive: { backgroundColor: C.brand },
  itemText: { fontSize: 14, fontWeight: "600", color: C.text, textAlign: "center" },
  itemTextActive: { color: "#fff", fontWeight: "800" },

  confirmBtn: {
    marginTop: 18,
    backgroundColor: C.brand,
    borderRadius: R.md,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
