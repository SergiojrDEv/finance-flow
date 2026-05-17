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
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;

const authService = new AuthSessionService({ authClient: supabase.auth });

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError("");
    setLoading(true);
    const result = await authService.requestPasswordReset({
      email: email.trim(),
      redirectTo: "financeflow://nova-senha",
    });
    setLoading(false);
    if (!result.ok) {
      setError((result as any).message || "Erro ao enviar e-mail.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center" }]} edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MailCheck size={32} color={C.income} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>E-mail enviado!</Text>
          <Text style={styles.successCopy}>
            Enviamos o link de recuperação para{"\n"}
            <Text style={{ fontWeight: "700", color: C.brand }}>{email}</Text>.{"\n\n"}
            Clique no link no e-mail para definir uma nova senha.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/auth/login")}>
            <Text style={styles.btnText}>Voltar ao login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); setError(""); }}>
            <Text style={styles.resendText}>Reenviar e-mail</Text>
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
          {/* ── HERO ── */}
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={22} color="rgba(255,255,255,.8)" />
            </TouchableOpacity>
            <View style={styles.glow} />
            <View style={styles.brandMark}>
              <Text style={styles.brandF}>F</Text>
            </View>
            <Text style={styles.heroName}>Recuperar senha</Text>
            <Text style={styles.heroSub}>Enviaremos um link para redefinir sua senha</Text>
          </View>

          {/* ── CARD ── */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>E-mail da conta</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                placeholderTextColor={C.subtle}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Enviar link de recuperação</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Lembrou a senha? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/login")}>
              <Text style={styles.footerLink}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: C.brand,
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 44,
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
  heroSub: { fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4, textAlign: "center", paddingHorizontal: 40 },

  card: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    padding: 28,
    paddingTop: 32,
    minHeight: 300,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: R.sm,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: C.expense,
  },
  errorText: { fontSize: 13, color: "#b91c1c", lineHeight: 18 },
  field: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.md,
    padding: 14,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.panelAlt,
  },
  btn: {
    backgroundColor: C.brand,
    borderRadius: R.md,
    padding: 16,
    alignItems: "center",
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
    backgroundColor: C.income + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 12 },
  successCopy: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  resendBtn: { marginTop: 14, alignItems: "center" },
  resendText: { fontSize: 13, color: C.brand, fontWeight: "600" },
});
