import { Tabs, useRouter } from "expo-router";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import { Home, Wallet, Plus, Target, Settings, BarChart2 } from "lucide-react-native";
import { fintechTheme } from "../../components/ui";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

const C = fintechTheme.colors;
const ACTIVE = C.brand;   // navy #0d1e35
const MUTED  = C.subtle;  // cinza suave

function PlusButton(_props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={plusStyles.wrap}
      onPress={() => router.push("/modal/lancamento")}
      activeOpacity={0.85}
    >
      <View style={plusStyles.outer}>
        <View style={plusStyles.inner}>
          <Plus size={22} color={C.brand} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const plusStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 14 : 6,
    shadowColor: C.brand,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  inner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? 14 : 10,
          backgroundColor: C.panel,
          borderTopColor: "transparent",
          borderTopWidth: 0,
          borderRadius: 24,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          shadowColor: C.ink,
          shadowOpacity: 0.13,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="carteira"
        options={{
          title: "Carteira",
          tabBarIcon: ({ color, size }) => (
            <Wallet size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="orcamentos"
        options={{
          title: "",
          tabBarButton: (props) => <PlusButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: "Metas",
          tabBarIcon: ({ color, size }) => (
            <Target size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
