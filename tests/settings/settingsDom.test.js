import assert from "node:assert/strict";
import test from "node:test";

import { createSettingsDom } from "../../src/settings/settingsDom.js";

function createElement() {
  return {
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      toggle(value, force) {
        if (force) this.values.add(value);
        else this.values.delete(value);
      },
      contains(value) { return this.values.has(value); },
    },
    focusCalled: false,
    hidden: false,
    innerHTML: "",
    resetCalled: false,
    textContent: "",
    value: "",
    focus() { this.focusCalled = true; },
    reset() { this.resetCalled = true; },
  };
}

function createFakeDocument() {
  const elements = new Map();
  const body = createElement();

  return {
    body,
    elements,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, createElement());
      return elements.get(selector);
    },
    querySelectorAll(selector) {
      return [this.querySelector(`${selector}:1`), this.querySelector(`${selector}:2`)];
    },
  };
}

test("centraliza leitura e escrita de campos de settings", () => {
  const documentRef = createFakeDocument();
  const dom = createSettingsDom(documentRef);

  dom.setValue("#name", "Reserva");
  dom.text("#title", "Editar");
  dom.html("#list", "<strong>Item</strong>");
  dom.setHidden("#field", true);

  assert.equal(dom.value("#name"), "Reserva");
  assert.equal(dom.get("#title").textContent, "Editar");
  assert.equal(dom.get("#list").innerHTML, "<strong>Item</strong>");
  assert.equal(dom.get("#field").hidden, true);
  assert.equal(dom.get("#field").classList.contains("is-hidden"), true);
});

test("centraliza abertura e fechamento de modal", () => {
  const documentRef = createFakeDocument();
  const dom = createSettingsDom(documentRef);

  dom.showModal("#modal");
  assert.equal(dom.get("#modal").classList.contains("is-hidden"), false);
  assert.equal(documentRef.body.classList.contains("modal-open"), true);

  dom.hideModal("#modal");
  assert.equal(dom.get("#modal").classList.contains("is-hidden"), true);
  assert.equal(documentRef.body.classList.contains("modal-open"), false);
});

test("centraliza leitura de formularios de criacao", () => {
  const documentRef = createFakeDocument();
  const dom = createSettingsDom(documentRef);

  dom.setValue("#new-category-type", "expense");
  dom.setValue("#new-category-name", " Moradia ");
  dom.setValue("#new-category-color", "#0b7285");
  dom.setValue("#new-category-limit", "2200");
  dom.setValue("#new-card-name", "Cartao");
  dom.setValue("#new-card-closing", "25");
  dom.setValue("#new-card-due", "10");
  dom.setValue("#new-subcategory-type", "expense");
  dom.setValue("#new-subcategory-category", "alimentacao");
  dom.setValue("#new-subcategory-name", " Mercado ");
  dom.setValue("#new-subcategory-color", "#c43d4b");
  dom.setValue("#new-goal-name", " Reserva ");
  dom.setValue("#new-goal-category", "renda-fixa");
  dom.setValue("#new-goal-target", "30000");

  assert.deepEqual(dom.readNewCategoryForm(), { type: "expense", name: "Moradia", color: "#0b7285", limit: 2200 });
  assert.deepEqual(dom.readNewCardForm(), { name: "Cartao", closingDay: 25, dueDay: 10 });
  assert.deepEqual(dom.readNewSubcategoryForm(), { type: "expense", categoryKey: "alimentacao", name: "Mercado", color: "#c43d4b" });
  assert.deepEqual(dom.readNewGoalForm(), { name: "Reserva", key: "renda-fixa", target: 30000 });
});
