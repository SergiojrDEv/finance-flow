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
    dataset: {},
    hidden: false,
    innerHTML: "",
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
    guideLabel: "Entrada de dinheiro",
    guideText: "Receitas aumentam o disponivel.",
    tone: "income",
    descriptionLabel: "Origem da receita",
    descriptionPlaceholder: "Ex: salario",
    categoryLabel: "Tipo de receita",
    accountLabel: "Conta de destino",
    amountLabel: "Valor recebido",
    dateLabel: "Recebido em",
    statusLabel: "Situacao",
    submitLabel: "Salvar receita",
  },
});

  assert.equal(documentRef.body.dataset.transactionTypeTone, "income");
  assert.equal(dom.get("#transaction-form-title").textContent, "Nova receita");
  assert.equal(dom.get("#transaction-submit").textContent, "Salvar receita");
  assert.equal(dom.get("#transaction-guide-label").textContent, "Entrada de dinheiro");
  assert.equal(dom.get("#transaction-guide-text").textContent, "Receitas aumentam o disponivel.");
  assert.equal(dom.get("#description-label").textContent, "Origem da receita");
  assert.equal(dom.get("#description").placeholder, "Ex: salario");
  assert.equal(dom.get("#account-label").textContent, "Conta de destino");
  assert.equal(dom.get("#date-label").textContent, "Recebido em");
  assert.equal(dom.get("#due-date-field").hidden, true);
  assert.equal(dom.get("#transaction-payment-row").hidden, true);
  assert.equal(dom.value("#due-date"), "");
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
      descriptionLabel: "Origem da receita",
      descriptionPlaceholder: "Ex: salario",
      categoryLabel: "Tipo de receita",
      accountLabel: "Conta de destino",
      amountLabel: "Valor recebido",
      dateLabel: "Recebido em",
      statusLabel: "Situacao",
    },
  });

  assert.equal(dom.get("#transaction-modal-title").textContent, "Editar receita");
  assert.equal(dom.get("#transaction-modal-copy").textContent, "Atualize a entrada.");
  assert.equal(dom.get("#transaction-modal-description-label").textContent, "Origem da receita");
  assert.equal(dom.get("#transaction-modal-description").placeholder, "Ex: salario");
  assert.equal(dom.get("#transaction-modal-account-label").textContent, "Conta de destino");
  assert.equal(dom.get("#transaction-modal-due-date-field").hidden, true);
  assert.equal(dom.get("#transaction-modal-payment-row").hidden, true);
  assert.equal(dom.value("#transaction-modal-due-date"), "");
  assert.equal(dom.value("#transaction-modal-payment-method"), "transfer");
  assert.equal(dom.value("#transaction-modal-subcategory"), "");
  assert.equal(dom.value("#transaction-modal-credit-card"), "");
});

test("centraliza opcoes de cartao e campos de credito", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);

  dom.syncCreditCardOptions('<option value="">Nenhum</option><option value="card-1">Cartao</option>');
  dom.setValue("#payment-method", "pix");
  dom.syncCreditPaymentFields({ isExpense: true, isCredit: false });
  dom.setValue("#transaction-modal-payment-method", "credit");
  dom.syncTransactionModalCreditFields({ isExpense: true, isCredit: true });

  assert.equal(dom.get("#credit-card").innerHTML, '<option value="">Nenhum</option><option value="card-1">Cartao</option>');
  assert.equal(dom.get("#transaction-modal-credit-card").innerHTML, '<option value="">Nenhum</option><option value="card-1">Cartao</option>');
  assert.equal(dom.readPaymentMethod(), "pix");
  assert.equal(dom.get("#credit-card-field").hidden, true);
  assert.equal(dom.value("#credit-card"), "");
  assert.equal(dom.value("#installments"), 1);
  assert.equal(dom.readTransactionModalPaymentMethod(), "credit");
  assert.equal(dom.get("#transaction-modal-credit-card-field").hidden, false);
});

test("centraliza opcoes do modal, subcategorias, segmentos e importacao", () => {
  const documentRef = createFakeDocument();
  const dom = createTransactionsDom(documentRef);
  const firstSegment = dom.get(".segment:1");
  const secondSegment = dom.get(".segment:2");
  const firstModalSegment = dom.get(".transaction-modal-segment:1");
  const secondModalSegment = dom.get(".transaction-modal-segment:2");
  firstSegment.dataset.type = "expense";
  secondSegment.dataset.type = "income";
  firstModalSegment.dataset.modalType = "expense";
  secondModalSegment.dataset.modalType = "income";

  dom.syncTransactionModalCategories('<option value="alimentacao">Alimentacao</option>');
  dom.setValue("#transaction-modal-category", "alimentacao");
  dom.syncTransactionModalAccounts('<option value="Conta corrente">Conta corrente</option>', "Conta corrente");
  dom.syncSubcategoryOptions({
    fieldSelector: "#subcategory-field",
    selectSelector: "#subcategory",
    optionsHtml: '<option value="">Sem subcategoria</option><option value="mercado">Mercado</option>',
    preferredValue: "mercado",
    visible: true,
  });
  dom.syncTransactionSegments("income");
  dom.syncTransactionModalSegments("expense");
  dom.showImportPreview("<strong>Previa</strong>");

  assert.equal(dom.get("#transaction-modal-category").innerHTML, '<option value="alimentacao">Alimentacao</option>');
  assert.equal(dom.get("#transaction-modal-account").value, "Conta corrente");
  assert.equal(dom.readTransactionModalCategory(), "alimentacao");
  assert.equal(dom.get("#subcategory-field").hidden, false);
  assert.equal(dom.value("#subcategory"), "mercado");
  assert.equal(firstSegment.classList.contains("active"), false);
  assert.equal(secondSegment.classList.contains("active"), true);
  assert.equal(firstModalSegment.classList.contains("active"), true);
  assert.equal(secondModalSegment.classList.contains("active"), false);
  assert.equal(dom.get("#import-preview").innerHTML, "<strong>Previa</strong>");
  assert.equal(dom.get("#import-preview").hidden, false);

  dom.clearImportPreview();
  assert.equal(dom.get("#import-preview").innerHTML, "");
  assert.equal(dom.get("#import-preview").hidden, true);
});
