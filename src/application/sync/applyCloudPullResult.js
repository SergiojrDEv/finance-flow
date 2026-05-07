export function applyCloudPullResult(currentState, pullResult, { syncSettingsFromCatalog } = {}) {
  if (!currentState) throw new Error("currentState e obrigatorio.");
  if (!pullResult) throw new Error("pullResult e obrigatorio.");

  if (pullResult.skipped) {
    return {
      skipped: true,
      shouldSyncSettingsFromCatalog: false,
      state: currentState,
    };
  }

  const hydrated = pullResult.hydrated || {};
  currentState.transactions = hydrated.transactions || [];

  if (pullResult.shouldSyncSettingsFromCatalog) {
    currentState.catalog = hydrated.catalog;
    currentState.dataMode = hydrated.dataMode;
    if (typeof syncSettingsFromCatalog === "function") {
      currentState.settings = syncSettingsFromCatalog();
    }
    return {
      skipped: false,
      shouldSyncSettingsFromCatalog: true,
      state: currentState,
    };
  }

  if (hydrated.hasSettings) {
    currentState.settings = hydrated.settings;
    currentState.catalog = hydrated.catalog;
    currentState.dataMode = hydrated.dataMode;
  }

  return {
    skipped: false,
    shouldSyncSettingsFromCatalog: false,
    state: currentState,
  };
}
