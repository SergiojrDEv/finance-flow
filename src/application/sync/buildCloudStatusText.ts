import type { CloudStatusInput } from "../shared/applicationTypes.js";

export function buildCloudStatusText({
  forcedText = "",
  cloudReady = false,
  isSyncing = false,
  userEmail = "",
}: CloudStatusInput = {}): string {
  if (forcedText) return forcedText;
  if (!cloudReady) return "Offline";
  if (isSyncing) return "Salvando...";
  if (userEmail) return `Salvo na nuvem: ${userEmail}`;
  return "Nao conectado";
}
