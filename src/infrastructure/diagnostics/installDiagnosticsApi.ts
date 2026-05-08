import {
  clearShadowDiagnostics,
  listShadowDiagnostics,
} from "./shadowDiagnostics.js";

type DiagnosticsTarget = object & {
  financeFlowDiagnostics?: unknown;
};

export function installDiagnosticsApi(target: DiagnosticsTarget = globalThis): unknown {
  if (!target || typeof target !== "object") return null;

  const api = Object.freeze({
    shadow: Object.freeze({
      list: listShadowDiagnostics,
      clear: clearShadowDiagnostics,
    }),
  });

  Object.defineProperty(target, "financeFlowDiagnostics", {
    value: api,
    configurable: true,
    enumerable: false,
    writable: false,
  });

  return api;
}
