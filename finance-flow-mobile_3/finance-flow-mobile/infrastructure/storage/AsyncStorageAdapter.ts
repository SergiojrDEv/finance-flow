import AsyncStorage from "@react-native-async-storage/async-storage";

// Substitui localStorage do projeto web
// Mesma interface, mas async — usado pelos repositories da camada infrastructure

export const STORAGE_KEY = "finance-flow-data-v1";
export const APP_STATE_KEY = "finance-flow-state-v2";

export async function loadRaw(key: string): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveRaw(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("[AsyncStorageAdapter] saveRaw error:", err);
  }
}

export async function removeRaw(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error("[AsyncStorageAdapter] removeRaw error:", err);
  }
}

// Adapter compatível com a interface que LocalXxxRepository espera
export const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
