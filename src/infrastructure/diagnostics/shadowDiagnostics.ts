const MAX_EVENTS = 100;

type ShadowDiagnosticLevel = "info" | "warn" | "error";

type ShadowDiagnosticDetails = Record<string, unknown> & {
  error?: {
    name?: string;
    message?: string;
  };
};

type ShadowDiagnosticInput = {
  scope?: string;
  level?: ShadowDiagnosticLevel;
  details?: ShadowDiagnosticDetails;
  now?: () => Date;
};

type ShadowDiagnosticEvent = {
  id: string;
  type: "shadow";
  scope: string;
  level: ShadowDiagnosticLevel;
  details: ShadowDiagnosticDetails;
  createdAt: string;
};

const events: ShadowDiagnosticEvent[] = [];

function sanitizeDetails(details: ShadowDiagnosticDetails): ShadowDiagnosticDetails {
  if (!details?.error) return details;
  return {
    ...details,
    error: {
      name: details.error.name,
      message: details.error.message,
    },
  };
}

export function recordShadowDiagnostic({
  scope,
  level = "warn",
  details = {},
  now = () => new Date(),
}: ShadowDiagnosticInput = {}): ShadowDiagnosticEvent {
  const event = {
    id: `${now().getTime()}-${events.length + 1}`,
    type: "shadow" as const,
    scope: scope || "unknown",
    level,
    details: sanitizeDetails(details),
    createdAt: now().toISOString(),
  };

  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

  if (level === "error") {
    console.warn("[Finance Flow Shadow]", event);
  }

  return event;
}

export function listShadowDiagnostics(): ShadowDiagnosticEvent[] {
  return [...events];
}

export function clearShadowDiagnostics(): void {
  events.splice(0, events.length);
}
