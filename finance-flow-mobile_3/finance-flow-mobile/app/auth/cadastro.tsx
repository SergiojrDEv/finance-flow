import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, MailCheck } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { AuthSessionService } from "../../src/application/auth/AuthSessionService.js";
import { onlyDigits } from "../../src/application/auth/validateAuth.js";
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;

const authService = new AuthSessionService({ authClient: supabase.auth });

function fmtCpf(val: string) {
  const d = onlyDigits(val).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function fmtPhone(val: string) {
  const d = onlyDigits(val).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CadastroScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCadastro() {
    setError("");
    setLoading(true);
    const result = await authService.signUp({
      profile: {
        fullName: fullName.trim(),
        cpf: onlyDigits(cpf),
        phone: phone.trim(),
        birthdate,
        email: email.trim(),
        password,
      },
      redirectTo: "financeflow://nova-senha",
    });
    setLoading(false);
    if (!result.ok) {
      setError((result as any).message || "Erro ao criar conta.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center" }]} edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MailCheck size={32} color={C.brand} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Conta criada!</Text>
          <Text style={styles.successCopy}>
            Enviamos um e-mail de confirmação para{"\n"}
            <Text style={{ fontWeight: "700", color: C.brand }}>{email}</Text>.{"\n\n"}
            Confirme seu e-mail antes de entrar.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/auth/login")}>
            <Text style={styles.btnText}>Ir para o login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO NAVY ── */}
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
            </TouchableOpacity>
            <View style={styles.glow} />
            <View style={styles.brandMark}>
              <Text style={styles.brandF}>F</Text>
            </View>
            <Text style={styles.heroName}>Criar conta</Text>
            <Text style={styles.heroSub}>Preencha seus dados para começar</Text>
          </View>

          {/* ── CARD ── */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field label="Nome completo">
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setError(""); }}
                placeholder="Como está no documento"
                autoCapitalize="words"
                placeholderTextColor={C.subtle}
              />
            </Field>

            <Field label="CPF">
              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(v) => { setCpf(fmtCpf(v)); setError(""); }}
                placeholder="000.000.000-00"
                keyboardType="numeric"
                maxLength={14}
                placeholderTextColor={C.subtle}
              />
            </Field>

            <Field label="Telefone">
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(v) => { setPhone(fmtPhone(v)); setError(""); }}
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                maxLength={15}
                placeholderTextColor={C.subtle}
              />
            </Field>

            <Field label="Data de nascimento">
              <TextInput
                style={styles.input}
                value={birthdate}
                onChangeText={(v) => { setBirthdate(v); setError(""); }}
                placeholder="AAAA-MM-DD"
                keyboardType="numeric"
                maxLength={10}
                placeholderTextColor={C.subtle}
              />
              <Text style={styles.hint}>Apenas maiores de 18 anos.</Text>
            </Field>

            <Field label="E-mail">
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={C.subtle}
              />
            </Field>

            <Field label="Senha">
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                placeholderTextColor={C.subtle}
              />
            </Field>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleCadastro}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Criar conta</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={styles.footerLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    backgroundColor: C.brand,
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 36,
    overflow: "hidden",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.gold,
    opacity: 0.07,
    top: -50,
    right: -50,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: C.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  brandF: { fontSize: 22, fontWeight: "900", color: C.brand },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 },

  // Card
  card: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 28,
  },

  // Error
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: C.expense,
  },
  errorText: { fontSize: 13, color: "#b91c1c", lineHeight: 18 },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.md,
    padding: 13,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.panelAlt,
  },
  hint: { fontSize: 11, color: C.subtle, marginTop: 5 },

  btn: {
    backgroundColor: C.brand,
    borderRadius: R.md,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: C.panel,
  },
  footerText: { fontSize: 14, color: C.muted },
  footerLink: { fontSize: 14, color: C.brand, fontWeight: "700" },

  // Success
  successWrap: {
    margin: 24,
    backgroundColor: C.panel,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.brand + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 12 },
  successCopy: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
