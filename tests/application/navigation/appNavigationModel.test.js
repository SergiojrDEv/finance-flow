import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_ROUTES,
  buildAppNavigationModel,
  getAppRouteIds,
  resolveAppSection,
} from "../../../src/application/navigation/appNavigationModel.js";

test("expoe contrato de rotas independente de framework", () => {
  assert.deepEqual(getAppRouteIds(), [
    "visao-geral",
    "carteira",
    "novo-lancamento",
    "orcamentos",
    "metas",
    "relatorios",
    "ajustes",
  ]);
  assert.equal(APP_ROUTES.every((route) => route.hash.startsWith("#")), true);
  assert.equal(APP_ROUTES.every((route) => route.label && route.mobileLabel && route.role), true);
});

test("resolve secao a partir do hash com aliases legados", () => {
  assert.deepEqual(resolveAppSection({ hash: "#carteira" }), {
    rawSectionId: "carteira",
    sectionId: "carteira",
    shouldPersist: true,
    transactionView: null,
  });

  assert.deepEqual(resolveAppSection({ hash: "#lancamentos-mes" }), {
    rawSectionId: "lancamentos-mes",
    sectionId: "novo-lancamento",
    shouldPersist: true,
    transactionView: "month",
  });
});

test("usa secao salva ou fallback quando hash nao e reconhecido", () => {
  assert.equal(resolveAppSection({ hash: "#nao-existe", savedSection: "metas" }).sectionId, "metas");
  assert.equal(resolveAppSection({ hash: "#nao-existe", savedSection: "invalida" }).sectionId, "visao-geral");
  assert.equal(resolveAppSection({ hash: "#nao-existe", fallback: "ajustes" }).sectionId, "ajustes");
});

test("monta modelo de navegacao com rotas principais mobile e secundarias", () => {
  const model = buildAppNavigationModel({ activeSection: "metas" });

  assert.equal(model.activeSection, "metas");
  assert.equal(model.routes.find((route) => route.id === "metas")?.active, true);
  assert.deepEqual(model.mobileRoutes.map((route) => route.id), [
    "visao-geral",
    "carteira",
    "novo-lancamento",
    "metas",
    "ajustes",
  ]);
  assert.deepEqual(model.secondaryRoutes.map((route) => route.id), ["orcamentos", "relatorios"]);
});
