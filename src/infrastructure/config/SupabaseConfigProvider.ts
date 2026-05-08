export const DEFAULT_SUPABASE_CONFIG_ENDPOINTS = [
  "/api/config",
  "/.netlify/functions/config",
];

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type FetchConfigOptions = {
  fetchImpl?: typeof fetch;
};

type LoadConfigOptions = {
  explicitConfig?: Partial<SupabasePublicConfig> | null;
  endpoints?: string[];
  fetchConfig?: (endpoint: string) => Promise<Partial<SupabasePublicConfig> | null>;
  fallbackConfig?: Partial<SupabasePublicConfig> | null;
  logger?: Pick<Console, "error"> | null;
};

function isValidConfig(config?: Partial<SupabasePublicConfig> | null): config is SupabasePublicConfig {
  return Boolean(config?.url && config?.anonKey);
}

export async function fetchSupabaseConfig(
  endpoint: string,
  { fetchImpl = globalThis.fetch }: FetchConfigOptions = {},
): Promise<SupabasePublicConfig | null> {
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
}: LoadConfigOptions = {}): Promise<SupabasePublicConfig | null> {
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
