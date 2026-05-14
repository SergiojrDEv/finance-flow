import assert from "node:assert/strict";
import test from "node:test";
import { getAppRouteIds } from "../../../src/application/navigation/appNavigationModel.js";
import {
  APP_SCREEN_COPY,
  buildAppShellModel,
  getAppScreenModel,
} from "../../../src/application/navigation/appScreenModel.js";

test("todas as rotas possuem contrato de tela para framework futuro", () => {
  const routeIds = getAppRouteIds();

  assert.deepEqual(Object.keys(APP_SCREEN_COPY), routeIds);

  for (const id of routeIds) {
    const screen = getAppScreenModel(id);
    assert.equal(screen.id, id);
    assert.ok(screen.eyebrow.length > 0);
    assert.ok(screen.title.length > 0);
    assert.ok(screen.description.length > 0);
    assert.ok(screen.primaryAction.label.length > 0);
    assert.ok(screen.primaryAction.href.startsWith("#"));
    assert.ok(screen.primaryAction.intent.length > 0);
    assert.equal(Array.isArray(screen.secondaryActions), true);
  }
});

test("usa visao geral como fallback de tela desconhecida", () => {
  const screen = getAppScreenModel("rota-inexistente");

  assert.equal(screen.id, "visao-geral");
  assert.equal(screen.primaryAction.intent, "compose-transaction");
});

test("monta shell de app com navegacao e tela ativa", () => {
  const shell = buildAppShellModel({ activeSection: "metas" });

  assert.equal(shell.activeSection, "metas");
  assert.equal(shell.navigation.activeSection, "metas");
  assert.equal(shell.screen.id, "metas");
  assert.equal(shell.screen.primaryAction.intent, "compose-investment");
  assert.equal(shell.navigation.routes.find((route) => route.id === "metas")?.active, true);
});

test("contrato de tela separa intencoes sem copiar regra financeira", () => {
  const compose = getAppScreenModel("novo-lancamento");
  const reports = getAppScreenModel("relatorios");
  const settings = getAppScreenModel("ajustes");

  assert.equal(compose.primaryAction.intent, "compose-transaction");
  assert.equal(reports.primaryAction.intent, "export-data");
  assert.equal(settings.primaryAction.intent, "manage-category");
});
