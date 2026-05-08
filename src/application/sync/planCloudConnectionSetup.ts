import { fail, ok } from "../shared/result.js";

const CONNECTION_UNAVAILABLE_MESSAGE = "Nao foi possivel conectar agora. Tente novamente em instantes.";

export function planCloudConnectionSetup({
  hasRuntimeFactory = false,
  hasConfig = false,
} = {}) {
  if (!hasRuntimeFactory) {
    return fail(
      { runtime: "cloud_runtime_unavailable" },
      {
        authGateMessage: CONNECTION_UNAVAILABLE_MESSAGE,
        statusText: "Nuvem indisponivel",
      },
    );
  }

  if (!hasConfig) {
    return fail(
      { config: "cloud_config_missing" },
      {
        authGateMessage: CONNECTION_UNAVAILABLE_MESSAGE,
        statusText: "Configure o deploy",
      },
    );
  }

  return ok({ shouldCreateClient: true });
}
