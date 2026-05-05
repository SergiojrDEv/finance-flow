const DEFAULT_FLAGS = Object.freeze({
  catalogShadow: false,
  transactionShadow: false,
});

function parseBoolean(value) {
  if (value === true || value === "true" || value === "1" || value === "on") return true;
  if (value === false || value === "false" || value === "0" || value === "off") return false;
  return null;
}

function readQueryFlag(name) {
  try {
    const params = new URLSearchParams(globalThis.location?.search || "");
    return parseBoolean(params.get(`ff_${name}`));
  } catch {
    return null;
  }
}

function readStorageFlag(name) {
  try {
    return parseBoolean(globalThis.localStorage?.getItem(`finance-flow:${name}`));
  } catch {
    return null;
  }
}

export function isFeatureEnabled(name) {
  const queryValue = readQueryFlag(name);
  if (queryValue !== null) return queryValue;

  const storageValue = readStorageFlag(name);
  if (storageValue !== null) return storageValue;

  return Boolean(DEFAULT_FLAGS[name]);
}

export function getFeatureFlags() {
  return Object.fromEntries(
    Object.keys(DEFAULT_FLAGS).map((name) => [name, isFeatureEnabled(name)])
  );
}
