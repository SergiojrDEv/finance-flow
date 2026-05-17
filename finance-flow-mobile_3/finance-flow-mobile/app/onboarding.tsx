import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Animated, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Check } from "lucide-react-native";
import { useAppStore } from "../stores/useAppStore";
import { fintechTheme } from "../components/ui";

const C = fintechTheme.colors;
const R = fintechTheme.radius;
const { width: W } = Dimensions.get("window");

const ACCOUNT_SUGGESTIONS = ["Carteira", "Nubank", "Itaú", "Bradesco", "Inter", "C6 Bank"];

const GOAL_OPTIONS = [
  { key: "reserva", emoji: "🏦", label: "Reserva de\nemergência", amount: 30000 },
  { key: "viagem", emoji: "✈️", label: "Viagem\ndos sonhos", amount: 9000 },
  { key: "imovel", emoji: "🏠", label: "Comprar\nimóvel", amount: 200000 },
  { key: "investir", emoji: "📈", label: "Investir\nmais", amount: 50000 },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, updateSettings, addGoal } = useAppStore();

  const [step, setStep] = useState(0);
  const [accountName, setAccountName] = useState("Carteira");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [goalAmount, setGoalAmount] = useState("");

  const slideAnim = useRef(new Animated.Value(0)).current;

  function animateTo(nextStep: number) {
    Animated.timing(slideAnim, {
      toValue: -nextStep * W,
      duration: 320,
      useNativeDriver: true,
    }).start();
    setStep(nextStep);
  }

  function goNext() {
    if (step < 2) animateTo(step + 1);
  }

  function finish() {
    // Salvar conta principal
    if (accountName.trim()) {
      updateSettings({ accounts: [accountName.trim(), "Conta corrente", "Corretora"] });
    }

    // Salvar meta se escolhida
    const goal = GOAL_OPTIONS.find((g) => g.key === selectedGoal);
    if (goal) {
      const amount = parseFloat(goalAmount.replace(/\./g, "").replace(",", ".")) || goal.amount;
      const keyMap: Record<string, string> = {
        reserva: "renda-fixa",
        viagem: "fundos",
        imovel: "renda-fixa",
        investir: "acoes",
      };
      addGoal({
        id: Date.now().toString(),
        name: goal.label.replace("\n", " "),
        target: amount,
        currentAmount: 0,
        key: keyMap[goal.key] ?? "fundos",
        isArchived: false,
      });
    }

    completeOnboarding();
    router.replace("/tabs");
  }

  function skip() {
    completeOnboarding();
    router.replace("/tabs");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Steps dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>

      {/* Slides */}
      <View style={styles.slidesWrap}>
        <Animated.View style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}>
          {/* ── STEP 0: WELCOME ── */}
          <View style={[styles.slide, { width: W }]}>
            <View style={styles.slideInner}>
              <View style={styles.glow} />
              <View style={styles.bigMark}>
                <Text style={styles.bigF}>F</Text>
              </View>
              <Text style={styles.welcomeTitle}>Bem-vindo ao{"\n"}Finance Flow</Text>
              <Text style={styles.welcomeSub}>
                Controle total das suas finanças em um só lugar. Vamos configurar tudo em 2 minutos.
              </Text>

              <View style={styles.featureList}>
                {[
                  "Acompanhe receitas, despesas e investimentos",
                  "Defina metas e monitore seu progresso",
                  "Controle seus limites por categoria",
                ].map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={styles.featureCheck}>
                      <Check size={12} color={C.gold} strokeWidth={3} />
                    </View>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── STEP 1: CONTA PRINCIPAL ── */}
          <View style={[styles.slide, { width: W }]}>
            <View style={styles.slideInner}>
              <Text style={styles.stepEmoji}>🏦</Text>
              <Text style={styles.stepTitle}>Sua conta principal</Text>
              <Text style={styles.stepSub}>
                Como você quer chamar sua conta principal? Pode ser o banco que mais usa.
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.accountInput}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Nome da conta"
                  placeholderTextColor="rgba(255,255,255,.35)"
                  maxLength={24}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.suggestLabel}>Sugestões</Text>
              <View style={styles.suggestRow}>
                {ACCOUNT_SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.suggestChip,
                      accountName === s && styles.suggestChipActive,
                    ]}
                    onPress={() => setAccountName(s)}
                  >
                    <Text style={[
                      styles.suggestText,
                      accountName === s && styles.suggestTextActive,
                    ]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── STEP 2: PRIMEIRA META ── */}
          <View style={[styles.slide, { width: W }]}>
            <ScrollView
              contentContainerStyle={styles.slideInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.stepEmoji}>🎯</Text>
              <Text style={styles.stepTitle}>Seu principal objetivo</Text>
              <Text style={styles.stepSub}>
                Escolha uma meta para começar. Você pode adicionar mais depois.
              </Text>

              <View style={styles.goalGrid}>
                {GOAL_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      styles.goalCard,
                      selectedGoal === g.key && styles.goalCardActive,
                    ]}
                    onPress={() => setSelectedGoal(g.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    <Text style={[
                      styles.goalLabel,
                      selectedGoal === g.key && styles.goalLabelActive,
                    ]}>{g.label}</Text>
                    {selectedGoal === g.key && (
                      <View style={styles.goalCheck}>
                        <Check size={10} color={C.brand} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {selectedGoal && (
                <View style={styles.amountWrap}>
                  <Text style={styles.amountLabel}>Valor da meta (R$)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={goalAmount}
                    onChangeText={setGoalAmount}
                    placeholder={String(GOAL_OPTIONS.find((g) => g.key === selectedGoal)?.amount ?? "")}
                    placeholderTextColor="rgba(255,255,255,.35)"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        {step < 2 ? (
          <>
            <TouchableOpacity
              style={[styles.nextBtn, step === 1 && !accountName.trim() && styles.nextBtnDisabled]}
              onPress={goNext}
              disabled={step === 1 && !accountName.trim()}
            >
              <Text style={styles.nextBtnText}>
                {step === 0 ? "Começar" : "Continuar"}
              </Text>
              <ArrowRight size={18} color={C.brand} strokeWidth={2.5} />
            </TouchableOpacity>
            {step > 0 && (
              <TouchableOpacity onPress={skip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Pular configuração</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.nextBtn} onPress={finish}>
              <Text style={styles.nextBtnText}>
                {selectedGoal ? "Criar meta e entrar" : "Entrar no app"}
              </Text>
              <ArrowRight size={18} color={C.brand} strokeWidth={2.5} />
            </TouchableOpacity>
            {!selectedGoal && (
              <TouchableOpacity onPress={finish} style={styles.skipBtn}>
                <Text style={styles.skipText}>Pular por agora</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.brand },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.25)",
  },
  dotActive: {
    width: 22,
    backgroundColor: C.gold,
  },

  slidesWrap: { flex: 1, overflow: "hidden" },
  slides: { flexDirection: "row", flex: 1 },
  slide: { flex: 1 },
  slideInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },

  // Welcome step
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.gold,
    opacity: 0.06,
    top: -40,
    right: -80,
  },
  bigMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: C.gold,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  bigF: { fontSize: 40, fontWeight: "900", color: C.brand },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 14,
  },
  welcomeSub: {
    fontSize: 15,
    color: "rgba(255,255,255,.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    maxWidth: 300,
  },
  featureList: { gap: 14, alignSelf: "stretch" },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(244,183,64,.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  featureText: { fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 20, flex: 1 },

  // Steps 1 & 2
  stepEmoji: { fontSize: 44, marginBottom: 16 },
  stepTitle: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center", letterSpacing: -0.5, marginBottom: 10 },
  stepSub: { fontSize: 14, color: "rgba(255,255,255,.55)", textAlign: "center", lineHeight: 21, marginBottom: 28, maxWidth: 290 },

  // Account input
  inputWrap: {
    alignSelf: "stretch",
    borderBottomWidth: 2,
    borderBottomColor: C.gold,
    marginBottom: 24,
  },
  accountInput: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    paddingVertical: 8,
    textAlign: "center",
  },
  suggestLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  suggestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.2)",
    backgroundColor: "rgba(255,255,255,.08)",
  },
  suggestChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  suggestText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,.7)" },
  suggestTextActive: { color: C.brand },

  // Goal grid
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 20, alignSelf: "stretch" },
  goalCard: {
    width: (W - 56 - 12) / 2,
    backgroundColor: "rgba(255,255,255,.08)",
    borderRadius: R.lg,
    padding: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,.1)",
    position: "relative",
  },
  goalCardActive: {
    backgroundColor: "rgba(244,183,64,.15)",
    borderColor: C.gold,
  },
  goalEmoji: { fontSize: 30, marginBottom: 10 },
  goalLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,.7)", textAlign: "center", lineHeight: 18 },
  goalLabelActive: { color: "#fff" },
  goalCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  amountWrap: { alignSelf: "stretch", marginTop: 4 },
  amountLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  amountInput: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,.2)",
    borderRadius: R.md,
    padding: 14,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,.07)",
  },

  // CTA
  cta: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
  },
  nextBtn: {
    backgroundColor: C.gold,
    borderRadius: R.md,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: "800", color: C.brand },
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipText: { fontSize: 13, color: "rgba(255,255,255,.45)", fontWeight: "600" },
});
