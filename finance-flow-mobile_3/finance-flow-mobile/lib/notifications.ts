import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { RecurringTransaction } from "../types";

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // ignore — notifications not available in this environment
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function cancelAllScheduled(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

export async function scheduleDailyReminder(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: "daily-reminder",
      content: {
        title: "Finance Flow",
        body: "Como foi o dia? Registre seus gastos antes de dormir.",
      },
      trigger: { seconds: 86400, repeats: true } as any,
    });
  } catch {
    // ignore
  }
}

export async function scheduleRecurringAlerts(
  recurrents: RecurringTransaction[]
): Promise<void> {
  try {
    const active = recurrents.filter((r) => r.isActive);
    for (const r of active) {
      const now = new Date();
      const alertDay = r.dayOfMonth - 1;
      const month = now.getDate() > alertDay ? now.getMonth() + 1 : now.getMonth();
      const year = now.getFullYear();
      const fireDate = new Date(year, month, alertDay < 1 ? 28 : alertDay, 9, 0, 0);
      if (fireDate <= now) continue;

      const amount = r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      await Notifications.scheduleNotificationAsync({
        identifier: `recurring-${r.id}`,
        content: {
          title: "Vencimento amanha",
          body: `${r.description} — ${amount}`,
        },
        trigger: { date: fireDate } as any,
      });
    }
  } catch {
    // ignore
  }
}

export async function sendBudgetAlert(category: string, pct: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `budget-${category}-${Date.now()}`,
      content: {
        title: "Orcamento proximo do limite",
        body: `Categoria "${category}" atingiu ${pct}% do orcamento mensal.`,
      },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

export async function setupNotifications(
  enabled: boolean,
  recurrents: RecurringTransaction[]
): Promise<boolean> {
  try {
    if (!enabled) {
      await cancelAllScheduled();
      return false;
    }
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await cancelAllScheduled();
    await scheduleDailyReminder();
    await scheduleRecurringAlerts(recurrents);
    return true;
  } catch {
    return false;
  }
}
