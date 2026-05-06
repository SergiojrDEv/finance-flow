export function hasUnsyncedLocalChanges({
  transactions = [],
  lastLocalChangeAt = null,
  lastCloudSyncAt = null,
} = {}) {
  if (!transactions.length) return false;
  if (!lastLocalChangeAt) return false;
  if (!lastCloudSyncAt) return true;
  return new Date(lastLocalChangeAt).getTime() > new Date(lastCloudSyncAt).getTime();
}

export function planCloudSyncStart({ hasUser = false, hasClient = false, isSyncing = false } = {}) {
  if (!hasUser || !hasClient) {
    return { shouldStart: false, shouldMarkPending: false };
  }
  if (isSyncing) {
    return { shouldStart: false, shouldMarkPending: true };
  }
  return { shouldStart: true, shouldMarkPending: false };
}

export function planCloudSyncCompletion({ pendingCloudSync = false, now = () => new Date() } = {}) {
  return {
    pendingCloudSync: false,
    lastCloudSyncAt: now().toISOString(),
    shouldRunAgain: Boolean(pendingCloudSync),
  };
}
