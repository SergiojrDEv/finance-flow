const MAX_EVENTS = 100;
const events = [];

function sanitizeDetails(details) {
  if (!details?.error) return details;
  return {
    ...details,
    error: {
      name: details.error.name,
      message: details.error.message,
    },
  };
}

export function recordShadowDiagnostic({ scope, level = "warn", details = {}, now = () => new Date() } = {}) {
  const event = {
    id: `${now().getTime()}-${events.length + 1}`,
    type: "shadow",
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

export function listShadowDiagnostics() {
  return [...events];
}

export function clearShadowDiagnostics() {
  events.splice(0, events.length);
}
