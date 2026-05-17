import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../stores/useAuthStore";
import { useAppStore } from "../stores/useAppStore";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const { user, loading, setSession, setLoading } = useAuthStore();
  const { hasOnboarded, loadFromCloud, applyRecurrents } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(session);
        router.replace("/auth/nova-senha");
        return;
      }

      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [router, setLoading, setSession]);

  // Pull cloud data whenever user changes (login / session restore)
  useEffect(() => {
    if (user?.id) {
      loadFromCloud(user.id);
    }
  }, [user?.id]);

  // Auto-apply recurring transactions for the current month on login/app open
  useEffect(() => {
    if (!user?.id || !hasOnboarded) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    applyRecurrents(currentMonth);
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "auth";
    const inNovaSenha = (segments as string[]).includes("nova-senha");

    if (inNovaSenha) return;

    if (!user && !inAuth) {
      router.replace("/auth/login");
    } else if (user && inAuth) {
      router.replace(hasOnboarded ? "/tabs" : "/onboarding");
    } else if (
      user && !inAuth &&
      segments[0] !== "onboarding" &&
      segments[0] !== "tabs" &&
      segments[0] !== "modal" &&
      segments[0] !== "gerenciar" &&
      segments[0] !== "relatorios"
    ) {
      router.replace(hasOnboarded ? "/tabs" : "/onboarding");
    }
  }, [user, loading, router, segments, hasOnboarded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
        <Stack.Screen
          name="modal/lancamento"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="modal/editar-lancamento"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="relatorios" options={{ headerShown: false }} />
        <Stack.Screen name="gerenciar/contas" options={{ headerShown: false }} />
        <Stack.Screen name="gerenciar/categorias" options={{ headerShown: false }} />
        <Stack.Screen name="gerenciar/cartoes" options={{ headerShown: false }} />
        <Stack.Screen name="gerenciar/recorrentes" options={{ headerShown: false }} />
        <Stack.Screen name="gerenciar/fatura" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
