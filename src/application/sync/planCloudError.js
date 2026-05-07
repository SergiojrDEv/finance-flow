export function planCloudError({ message = "" } = {}) {
  return {
    shouldStopSyncing: true,
    shouldRenderStatus: true,
    shouldNotify: true,
    message: String(message || "").trim(),
  };
}
