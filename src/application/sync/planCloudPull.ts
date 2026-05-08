export function planCloudPullStart({
  silent = false,
  hasLocalTransactions = false,
  hasUnsyncedLocalChanges = false,
} = {}) {
  if (!silent && hasLocalTransactions) {
    return {
      action: "confirm-replace",
      shouldAskConfirmation: true,
      shouldRenderStatus: false,
      statusText: "",
      shouldScheduleAutoSync: false,
      shouldContinue: false,
    };
  }

  if (silent && hasUnsyncedLocalChanges) {
    return {
      action: "sync-local-first",
      shouldAskConfirmation: false,
      shouldRenderStatus: true,
      statusText: "Salvando pendencias...",
      shouldScheduleAutoSync: true,
      shouldContinue: false,
    };
  }

  return {
    action: "pull",
    shouldAskConfirmation: false,
    shouldRenderStatus: !silent,
    statusText: silent ? "" : "Baixando...",
    shouldScheduleAutoSync: false,
    shouldContinue: true,
  };
}

export function planCloudPullAfterConfirmation({ confirmed = false } = {}) {
  return {
    action: confirmed ? "pull" : "cancel",
    shouldContinue: Boolean(confirmed),
    shouldRenderStatus: Boolean(confirmed),
    statusText: confirmed ? "Baixando..." : "",
  };
}

export function planCloudPullCompletion({ skipped = false, silent = false } = {}) {
  if (skipped) {
    return {
      action: "skipped",
      shouldSave: false,
      shouldUpdateOptions: false,
      shouldRenderAll: false,
      shouldRenderStatus: true,
      shouldNotify: false,
    };
  }

  return {
    action: "applied",
    shouldSave: true,
    shouldUpdateOptions: true,
    shouldRenderAll: true,
    shouldRenderStatus: true,
    shouldNotify: !silent,
  };
}
