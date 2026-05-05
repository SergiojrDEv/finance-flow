import assert from "node:assert/strict";
import test from "node:test";

globalThis.document = {
  querySelector() {
    return null;
  },
};

const { safeCssColor } = await import("../../src/core/utils.js");

test("aceita cores hexadecimais e variaveis CSS conhecidas", () => {
  assert.equal(safeCssColor("#0b7285"), "#0b7285");
  assert.equal(safeCssColor("#fff"), "#fff");
  assert.equal(safeCssColor("var(--invest)"), "var(--invest)");
});

test("recusa valores de cor inseguros para style inline", () => {
  assert.equal(safeCssColor("red"), "#667085");
  assert.equal(safeCssColor("url(javascript:alert(1))"), "#667085");
  assert.equal(safeCssColor("var(--x);background:red"), "#667085");
  assert.equal(safeCssColor("", "#0b7285"), "#0b7285");
});
