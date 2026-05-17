import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CircleCheck, LockKeyhole } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { AuthSessionService } from "../../src/application/auth/AuthSessionService.js";
import { useAuthStore } from "../../stores/useAuthStore";
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;

const authService = new AuthSessionService({ authClient: supabase.auth });

function strengthColor(len: number) {
  if (len >= 10) return C.income;
  if (len >= 7) return "#f08c00";
  return C.expense;
}

function strengthLabel(len: number) {
  if (len < 6) return "Muito curta";
  if (len < 8) return "Fraca";
  if (len < 10) return "Razoável";
  return "Forte";
}

export default function NovaSenhaScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsRecovery(true);
        setSession(data.session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        if (session) setSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleUpdate() {
    setError("");
    setLoading(true);
    const result = await authService.updatePassword({ password, confirmPassword: confirm });
    setLoading(false);
    if (!result.ok) {
      setError((result as any).message || "Erro ao atualizar senha.");
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
  }

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center" }]} edges={["top", "bottom"]}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: C.income + "15" }]}>
            <CircleCheck size={32} color={C.income} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Senha atualizada!</Text>
          <Text style={styles.successCopy}>
            Sua nova senha foi definida com sucesso.{"\n"}
            Faça login com ela agora.
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
          {/* ── HERO ── */}
          <View style={styles.hero}>
            <View style={styles.glow} />
            <View style={styles.brandMark}>
              <LockKeyhole size={24} color={C.brand} strokeWidth={2.5} />
            </View>
            <Text style={styles.heroName}>Nova senha</Text>
            <Text style={styles.heroSub}>Defina uma senha segura para sua conta</Text>
          </View>

          {/* ── CARD ── */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isRecovery && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Esta tela deve ser acessada via link de recuperação enviado ao seu e-mail.
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Nova senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(""); }}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                autoFocus={isRecovery}
                placeholderTextColor={C.subtle}
              />
            </View>

            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: password.length >= (i + 1) * 3 ? strengthColor(password.length) : C.line },
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, { color: strengthColor(password.length) }]}>
                  {strengthLabel(password.length)}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar nova senha</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={(v) => { setConfirm(v); setError(""); }}
                placeholder="Repita a senha"
                secureTextEntry
                placeholderTextColor={C.subtle}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, (loading || !isRecovery) && styles.btnDisabled]}
              onPress={handleUpdate}
              disabled={loading || !isRecovery}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Salvar nova senha</Text>}
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
    paddingTop: 48,
    paddingBottom: 44,
    overflow: "hidden",
    position: "relative",
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
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4, textAlign: "center", paddingHorizontal: 40 },

  card: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    padding: 28,
    paddingTop: 32,
    minHeight: 360,
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
  warnBox: {
    backgroundColor: "#fffbeb",
    borderRadius: R.sm,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  warnText: { fontSize: 12, color: "#92400e", lineHeight: 18 },
  field: { marginBottom: 18 },
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
    marginTop: -8,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 68 },
  btn: {
    backgroundColor: C.brand,
    borderRadius: R.md,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 12 },
  successCopy: { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
});
