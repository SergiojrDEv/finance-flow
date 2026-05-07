import assert from "node:assert/strict";
import test from "node:test";
import { buildCloudStatusText } from "../../../src/application/sync/buildCloudStatusText.js";

test("usa texto forcado quando informado", () => {
  assert.equal(buildCloudStatusText({ forcedText: "Baixando..." }), "Baixando...");
});

test("mostra offline quando nuvem nao esta pronta", () => {
  assert.equal(buildCloudStatusText({ cloudReady: false }), "Offline");
});

test("mostra salvando enquanto sincroniza", () => {
  assert.equal(buildCloudStatusText({ cloudReady: true, isSyncing: true }), "Salvando...");
});

test("mostra email quando usuario esta conectado", () => {
  assert.equal(
    buildCloudStatusText({ cloudReady: true, userEmail: "sergio@example.com" }),
    "Salvo na nuvem: sergio@example.com"
  );
});

test("mostra nao conectado quando nuvem pronta nao possui usuario", () => {
  assert.equal(buildCloudStatusText({ cloudReady: true }), "Nao conectado");
});
