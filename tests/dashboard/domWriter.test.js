import assert from "node:assert/strict";
import test from "node:test";

import { createDashboardDomWriter } from "../../src/dashboard/domWriter.js";

function createFakeDocument() {
  const elements = new Map();

  return {
    elements,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, { textContent: "", innerHTML: "" });
      return elements.get(selector);
    },
  };
}

test("escreve texto e html por seletor sem acoplar ao document global", () => {
  const documentRef = createFakeDocument();
  const writer = createDashboardDomWriter(documentRef);

  writer.setText("#income-total", "R$ 1.000,00");
  writer.setHtml("#category-breakdown", "<strong>Moradia</strong>");

  assert.equal(documentRef.elements.get("#income-total").textContent, "R$ 1.000,00");
  assert.equal(documentRef.elements.get("#category-breakdown").innerHTML, "<strong>Moradia</strong>");
});
