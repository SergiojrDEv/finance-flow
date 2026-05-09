import assert from "node:assert/strict";
import test from "node:test";

import { createTransactionsDom } from "../../src/transactions/transactionsDom.js";

function createElement() {
  return {
    classList: {
      values: new Set(["is-hidden"]),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); },
    },
    focusCalled: false,
    resetCalled: false,
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
  };
}

test("centraliza preenchimento e leitura do modal de lancamento", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);

  dom.fillTransactionModal({
    description: "Mercado",
    category: "alimentacao",
    subcategory: "mercado",
    account: "Conta corrente",
    amount: 120,
    date: "2026-05-08",
    dueDate: "2026-05-10",
    status: "pending",
    paymentMethod: "credit",
    creditCardId: "card-1",
  });
  dom.setValue("#transaction-modal-subcategory", "mercado");

  assert.deepEqual(dom.readTransactionModalForm(), {
    description: "Mercado",
    category: "alimentacao",
    subcategory: "mercado",
    account: "Conta corrente",
    amount: 120,
    date: "2026-05-08",
    dueDate: "2026-05-10",
    status: "pending",
    paymentMethod: "credit",
    creditCardId: "card-1",
  });
});

test("centraliza abertura e fechamento do modal de lancamento", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);

  dom.openTransactionModal();
  assert.equal(dom.get("#transaction-modal-overlay").classList.contains("is-hidden"), false);
  assert.equal(documentRef.body.classList.contains("modal-open"), true);
  assert.equal(dom.get("#transaction-modal-description").focusCalled, true);

  dom.closeTransactionModal();
  assert.equal(dom.get("#transaction-modal-form").resetCalled, true);
  assert.equal(dom.get("#transaction-modal-overlay").classList.contains("is-hidden"), true);
  assert.equal(documentRef.body.classList.contains("modal-open"), false);
});

test("centraliza leitura do formulario principal de lancamento", () => {
  const dom = createTransactionsDom(createFakeDocument());
  const values = new Map([
    ["description", "Salario"],
    ["category", "salario"],
    ["subcategory", ""],
    ["account", "Conta corrente"],
    ["amount", "3100"],
    ["date", "2026-05-08"],
    ["dueDate", "2026-05-08"],
    ["status", "paid"],
    ["paymentMethod", "transfer"],
    ["creditCardId", ""],
    ["recurrence", "none"],
    ["repeatCount", "1"],
    ["installments", "1"],
  ]);

  assert.deepEqual(dom.readTransactionForm({ get: (key) => values.get(key) }), {
    description: "Salario",
    category: "salario",
    subcategory: "",
    account: "Conta corrente",
    amount: "3100",
    date: "2026-05-08",
    dueDate: "2026-05-08",
    status: "paid",
    paymentMethod: "transfer",
    creditCardId: "",
    recurrence: "none",
    repeatCount: "1",
    installments: "1",
  });
});
