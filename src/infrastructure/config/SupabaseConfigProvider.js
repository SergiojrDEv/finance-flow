export const DEFAULT_SUPABASE_CONFIG_ENDPOINTS = [
  "/api/config",
  "/.netlify/functions/config",
];

function isValidConfig(config) {
  return Boolean(config?.url && config?.anonKey);
}

export async function fetchSupabaseConfig(endpoint, { fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) {
    throw new Error("fetchImpl e obrigatorio.");
  }

  const response = await fetchImpl(endpoint, { cache: "no-store" });
  if (!response?.ok) return null;

  const config = await response.json();
  return isValidConfig(config) ? config : null;
}

export async function loadSupabaseConfig({
  explicitConfig,
  endpoints = DEFAULT_SUPABASE_CONFIG_ENDPOINTS,
  fetchConfig,
  fallbackConfig = null,
  logger = console,
} = {}) {
  if (isValidConfig(explicitConfig)) return explicitConfig;

  if (!fetchConfig || typeof fetchConfig !== "function") {
    throw new Error("fetchConfig e obrigatorio.");
  }

  for (const endpoint of endpoints) {
    try {
      const config = await fetchConfig(endpoint);
      if (isValidConfig(config)) return config;
    } catch (error) {
      logger?.error?.("Erro ao carregar config do Supabase", endpoint, error);
    }
  }

  return isValidConfig(fallbackConfig) ? fallbackConfig : null;
}
