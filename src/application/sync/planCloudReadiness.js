import { fail, ok } from "../shared/result.js";

export function planCloudReadiness({
  hasClient = false,
  hasInitPromise = false,
} = {}) {
  if (hasClient) {
    return ok({
      shouldCreateInitPromise: false,
      shouldWaitInit: false,
    });
  }

  return ok({
    shouldCreateInitPromise: !hasInitPromise,
    shouldWaitInit: true,
  });
}

export function planCloudReadinessAfterInit({
  isReady = false,
  hasClient = false,
} = {}) {
  if (!isReady || !hasClient) return fail({ readiness: "cloud_unavailable" });
  return ok({});
}
