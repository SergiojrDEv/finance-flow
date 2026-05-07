import { fail, ok } from "../shared/result.js";

export function planCloudUserRequirement({ hasClient = false, hasUser = false } = {}) {
  if (!hasClient) {
    return fail({ client: "cloud_unavailable" });
  }
  if (!hasUser) {
    return fail({ user: "user_required" });
  }
  return ok({});
}
