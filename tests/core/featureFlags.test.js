import assert from "node:assert/strict";
import test from "node:test";
import { getFeatureFlags, isFeatureEnabled } from "../../src/core/featureFlags.js";

test("mantem flags desligadas por padrao", () => {
  assert.equal(isFeatureEnabled("transactionShadow"), false);
});

test("permite ativar flag via query string", () => {
  const originalLocation = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    value: { search: "?ff_transactionShadow=true" },
    configurable: true,
  });

  assert.equal(isFeatureEnabled("transactionShadow"), true);

  Object.defineProperty(globalThis, "location", {
    value: originalLocation,
    configurable: true,
  });
});

test("permite ativar flag via localStorage quando nao houver query string", () => {
  const originalLocation = globalThis.location;
  const originalLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "location", {
    value: { search: "" },
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key) => key === "finance-flow:transactionShadow" ? "1" : null,
    },
    configurable: true,
  });

  assert.equal(getFeatureFlags().transactionShadow, true);

  Object.defineProperty(globalThis, "location", {
    value: originalLocation,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: originalLocalStorage,
    configurable: true,
  });
});
