import { createFinanceFlowRuntime, startFinanceFlow } from "./core/runtime.js";

const runtime = createFinanceFlowRuntime();

startFinanceFlow(runtime).catch((error) => {
  console.error(error);
  runtime.state.currentUser = null;
  runtime.state.cloudReady = false;
  runtime.deps.renderAuthGate("Nao foi possivel carregar agora. Atualize a pagina.");
});
