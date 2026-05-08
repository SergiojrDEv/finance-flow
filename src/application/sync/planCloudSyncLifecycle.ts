import type { CloudSyncCompletionPlan, CloudSyncStartPlan, CloudSyncState } from "../shared/applicationTypes.js";

export function hasUnsyncedLocalChanges({
  transactions = [],
  lastLocalChangeAt = null,
  lastCloudSyncAt = null,
}: Pick<CloudSyncState, "transactions" | "lastLocalChangeAt" | "lastCloudSyncAt"> = {}): boolean {
  if (!transactions.length) return false;
  if (!lastLocalChangeAt) return false;
  if (!lastCloudSyncAt) return true;
  return new Date(lastLocalChangeAt).getTime() > new Date(lastCloudSyncAt).getTime();
}

export function planCloudSyncStart({
  hasUser = false,
  hasClient = false,
  isSyncing = false,
}: {
  hasUser?: boolean;
  hasClient?: boolean;
  isSyncing?: boolean;
} = {}): CloudSyncStartPlan {
  if (!hasUser || !hasClient) {
    return { shouldStart: false, shouldMarkPending: false };
  }
  if (isSyncing) {
    return { shouldStart: false, shouldMarkPending: true };
  }
  return { shouldStart: true, shouldMarkPending: false };
}

export function planCloudSyncCompletion({
  pendingCloudSync = false,
  now = () => new Date(),
}: {
  pendingCloudSync?: boolean;
  now?: () => Date;
} = {}): CloudSyncCompletionPlan {
  return {
    pendingCloudSync: false,
    lastCloudSyncAt: now().toISOString(),
    shouldRunAgain: Boolean(pendingCloudSync),
  };
}

export function planCloudSyncCompletionEffects({ shouldRunAgain = false }: { shouldRunAgain?: boolean } = {}) {
  return {
    shouldSave: true,
    shouldRenderStatus: true,
    shouldScheduleRunAgain: Boolean(shouldRunAgain),
  };
}

export function applyCloudSyncStart(currentState: CloudSyncState, startPlan: CloudSyncStartPlan) {
  if (!currentState) throw new Error("currentState e obrigatorio.");
  if (!startPlan) throw new Error("startPlan e obrigatorio.");

  if (startPlan.shouldMarkPending) {
    currentState.pendingCloudSync = true;
    return { started: false, pending: true };
  }
  if (!startPlan.shouldStart) {
    return { started: false, pending: false };
  }

  currentState.isSyncing = true;
  currentState.pendingCloudSync = false;
  return { started: true, pending: false };
}

export function applyCloudSyncCompletion(currentState: CloudSyncState, completionPlan: CloudSyncCompletionPlan) {
  if (!currentState) throw new Error("currentState e obrigatorio.");
  if (!completionPlan) throw new Error("completionPlan e obrigatorio.");

  currentState.isSyncing = false;
  currentState.lastCloudSyncAt = completionPlan.lastCloudSyncAt;
  currentState.pendingCloudSync = completionPlan.pendingCloudSync;

  return {
    shouldRunAgain: completionPlan.shouldRunAgain,
    state: currentState,
  };
}
