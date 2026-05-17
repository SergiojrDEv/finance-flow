import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { AuthSessionService } from "../../src/application/auth/AuthSessionService.js";
import { fintechTheme } from "../../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;

const authService = new AuthSessionService({ authClient: supabase.auth });

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    setLoading(true);
    const result = await authService.signIn({ email: email.trim(), password });
    setLoading(false);
    if (!result.ok) {
      setError((result as any).message || "Erro ao entrar.");
    }
    // RootLayout redireciona automaticamente via onAuthStateChange
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
            {/* Brilho decorativo */}
            <View style={styles.glow} />
            <View style={styles.brandMark}>
              <Text style={styles.brandF}>F</Text>
            </View>
            <Text style={styles.heroName}>Finance Flow</Text>
            <Text style={styles.heroSub}>Seu dinheiro, sob controle</Text>
          </View>

          {/* ── CARD ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
            <Text style={styles.cardSub}>Entre na sua conta para continuar</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor={C.subtle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  placeholder="Digite sua senha"
                  secureTextEntry={!showPassword}
                  placeholderTextColor={C.subtle}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                >
                  {showPassword
                    ? <EyeOff size={18} color={C.muted} />
                    : <Eye size={18} color={C.muted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => router.push("/auth/recuperar")}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Entrar</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/auth/cadastro")}
            >
              <Text style={styles.secondaryBtnText}>Criar conta gratuita</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            Ao entrar, você concorda com os{" "}
            <Text style={{ color: C.brand }}>Termos de uso</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    backgroundColor: C.brand,
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 44,
    overflow: "hidden",
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.gold,
    opacity: 0.07,
    top: -60,
    right: -60,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  brandF: { fontSize: 28, fontWeight: "900", color: C.brand },
  heroName: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 },

  // Card
  card: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    padding: 28,
    paddingTop: 32,
    minHeight: 480,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: C.muted, marginBottom: 24 },

  // Error
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: R.sm,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.expense,
  },
  errorText: { fontSize: 13, color: "#b91c1c", lineHeight: 18 },

  // Fields
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
  passwordWrap: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: R.md,
    backgroundColor: C.panelAlt,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: C.text },
  eyeBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },

  forgotLink: { alignSelf: "flex-end", marginBottom: 20, marginTop: -8 },
  forgotText: { fontSize: 13, color: C.brand, fontWeight: "600" },

  // Buttons
  btn: {
    backgroundColor: C.brand,
    borderRadius: R.md,
    padding: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 12, color: C.subtle, fontWeight: "600" },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: C.brand,
    borderRadius: R.md,
    padding: 15,
    alignItems: "center",
  },
  secondaryBtnText: { color: C.brand, fontSize: 15, fontWeight: "700" },

  legal: {
    fontSize: 11,
    color: C.subtle,
    textAlign: "center",
    paddingVertical: 16,
    backgroundColor: C.panel,
    paddingHorizontal: 28,
  },
});
