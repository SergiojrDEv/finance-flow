import assert from "node:assert/strict";
import test from "node:test";

test("usa fallback quando categoria vem de tipo antigo ou desconhecido", async () => {
  global.document = {
    querySelector: () => null,
  };
  const { categoryDisplayLabel, getCategory } = await import("../../src/core/utils.js");

  assert.deepEqual(getCategory("legacy", "mercado"), ["mercado", "mercado", "#667085"]);
  assert.equal(categoryDisplayLabel({ type: "legacy", category: "mercado" }), "mercado");
  delete global.document;
});
