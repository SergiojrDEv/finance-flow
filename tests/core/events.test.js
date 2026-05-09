import assert from "node:assert/strict";
import test from "node:test";

globalThis.document = {
  querySelector() {
    return null;
  },
};

const { openTransactionComposer } = await import("../../src/core/events.js");

test("atalho rapido abre lancamento no tipo escolhido", () => {
  const calls = [];
  const focused = { value: false };
  const scrolled = { value: false };
  const locationRef = { hash: "" };
  const documentRef = {
    querySelector(selector) {
      if (selector === "#description") {
        return { focus: () => { focused.value = true; } };
      }
      if (selector === "#transaction-form") {
        return { scrollIntoView: () => { scrolled.value = true; } };
      }
      return null;
    },
  };
  const deps = {
    setTransactionView: (view) => calls.push(["view", view]),
    setActiveType: (type) => calls.push(["type", type]),
    setSectionFromHash: () => calls.push(["section"]),
  };

  openTransactionComposer({ deps, documentRef, locationRef, type: "investment" });

  assert.equal(locationRef.hash, "novo-lancamento");
  assert.deepEqual(calls, [["view", "compose"], ["type", "investment"], ["section"]]);
  assert.equal(focused.value, true);
  assert.equal(scrolled.value, true);
});

test("botao generico de novo lancamento preserva tipo atual", () => {
  const calls = [];
  const deps = {
    setTransactionView: (view) => calls.push(["view", view]),
    setActiveType: (type) => calls.push(["type", type]),
    setSectionFromHash: () => calls.push(["section"]),
  };

  openTransactionComposer({
    deps,
    documentRef: { querySelector: () => null },
    locationRef: { hash: "" },
  });

  assert.deepEqual(calls, [["view", "compose"], ["section"]]);
});
