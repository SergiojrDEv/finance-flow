import assert from "node:assert/strict";
import test from "node:test";

import { createTransactionsDom } from "../../src/transactions/transactionsDom.js";

function createElement() {
  return {
    classList: {
      values: new Set(["is-hidden"]),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      toggle(value, force) {
        if (force) this.values.add(value);
        else this.values.delete(value);
      },
      contains(value) { return this.values.has(value); },
    },
    focusCalled: false,
    resetCalled: false,
    disabled: true,
    hidden: false,
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

test("centraliza reset e controles do formulario principal", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);
  const form = createElement();

  dom.enableTransactionSeriesControls();
  dom.hideCancelEdit();
  dom.resetTransactionForm(form);

  assert.equal(dom.get("#installments").disabled, false);
  assert.equal(dom.get("#recurrence").disabled, false);
  assert.equal(dom.get("#repeat-count").disabled, false);
  assert.equal(dom.get("#cancel-edit").classList.contains("is-hidden"), true);
  assert.equal(form.resetCalled, true);
});

test("centraliza campos visuais por tipo de lancamento", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);

  dom.syncTransactionTypeFields({
    isExpense: false,
    defaultPaymentMethod: "transfer",
    experience: {
      formTitle: "Nova receita",
      formCopy: "Receba sem campos de despesa.",
      heroTitle: "Cadastre uma receita",
      heroCopy: "Entrada do mes.",
      submitLabel: "Salvar receita",
    },
  });

  assert.equal(dom.get("#transaction-form-title").textContent, "Nova receita");
  assert.equal(dom.get("#transaction-submit").textContent, "Salvar receita");
  assert.equal(dom.get("#transaction-payment-row").hidden, true);
  assert.equal(dom.value("#payment-method"), "transfer");
  assert.equal(dom.value("#credit-card"), "");
  assert.equal(dom.value("#installments"), 1);
  assert.equal(dom.value("#recurrence"), "none");
  assert.equal(dom.value("#repeat-count"), 1);
  assert.equal(dom.value("#subcategory"), "");
});

test("centraliza campos visuais do modal por tipo de lancamento", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);

  dom.syncTransactionModalTypeFields({
    isExpense: false,
    defaultPaymentMethod: "transfer",
    experience: {
      modalTitle: "Editar receita",
      modalCopy: "Atualize a entrada.",
    },
  });

  assert.equal(dom.get("#transaction-modal-title").textContent, "Editar receita");
  assert.equal(dom.get("#transaction-modal-copy").textContent, "Atualize a entrada.");
  assert.equal(dom.get("#transaction-modal-payment-row").hidden, true);
  assert.equal(dom.value("#transaction-modal-payment-method"), "transfer");
  assert.equal(dom.value("#transaction-modal-subcategory"), "");
  assert.equal(dom.value("#transaction-modal-credit-card"), "");
});
