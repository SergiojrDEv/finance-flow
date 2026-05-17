import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { RecurringTransaction } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Daily reminder at 20:00 to log expenses
export async function scheduleDailyReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: "daily-reminder",
    content: {
      title: "💰 Finance Flow",
      body: "Como foi o dia? Registre seus gastos antes de dormir.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// Alert 1 day before each active recurring transaction is due
export async function scheduleRecurringAlerts(
  recurrents: RecurringTransaction[]
): Promise<void> {
  const active = recurrents.filter((r) => r.isActive);
  for (const r of active) {
    const now = new Date();
    const alertDay = r.dayOfMonth - 1; // day before
    const month = now.getDate() > alertDay ? now.getMonth() + 1 : now.getMonth();
    const year = now.getFullYear();
    const fireDate = new Date(year, month, alertDay < 1 ? 28 : alertDay, 9, 0, 0);

    if (fireDate <= now) continue; // already passed this month

    const amount = r.amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    await Notifications.scheduleNotificationAsync({
      identifier: `recurring-${r.id}`,
      content: {
        title: "📅 Vencimento amanhã",
        body: `${r.description} — ${amount}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  }
}

// Alert when a category budget is ≥80% used
export async function sendBudgetAlert(
  category: string,
  pct: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `budget-${category}-${Date.now()}`,
    content: {
      title: "⚠️ Orçamento próximo do limite",
      body: `Categoria "${category}" atingiu ${pct}% do orçamento mensal.`,
    },
    trigger: null, // immediate
  });
}

export async function setupNotifications(
  enabled: boolean,
  recurrents: RecurringTransaction[]
): Promise<boolean> {
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
}
