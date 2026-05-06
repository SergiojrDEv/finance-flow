import assert from "node:assert/strict";
import test from "node:test";
import { validateTransactionDraft } from "../../src/application/transactions/validateTransactionDraft.js";

const baseDraft = {
  userId: "user-1",
  type: "expense",
  description: "Supermercado",
  category: "alimentacao",
  account: "Conta corrente",
  amount: 120.5,
  date: "2026-04-24",
  status: "paid",
};

test("aceita despesa valida com campos de pagamento", () => {
  const result = validateTransactionDraft({
    ...baseDraft,
    paymentMethod: "pix",
    dueDate: "2026-04-30",
    recurrence: "none",
    repeatCount: 1,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test("aceita lancamento previsto", () => {
  const result = validateTransactionDraft({
    ...baseDraft,
    status: "planned",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test("bloqueia receita com campo exclusivo de despesa", () => {
  const result = validateTransactionDraft({
    ...baseDraft,
    type: "income",
    description: "Salario",
    category: "salario",
    paymentMethod: "pix",
    creditCardId: "card-1",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.paymentMethod, "Campo permitido apenas para despesas.");
  assert.equal(result.errors.creditCardId, "Campo permitido apenas para despesas.");
});

test("bloqueia investimento com vencimento e recorrencia", () => {
  const result = validateTransactionDraft({
    ...baseDraft,
    type: "investment",
    description: "Tesouro Direto",
    category: "renda-fixa",
    dueDate: "2026-05-10",
    recurrence: "monthly",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.dueDate, "Campo permitido apenas para despesas.");
  assert.equal(result.errors.recurrence, "Campo permitido apenas para despesas.");
});

test("bloqueia lancamento sem usuario, valor e data validos", () => {
  const result = validateTransactionDraft({
    ...baseDraft,
    userId: "",
    amount: 0,
    date: "24/04/2026",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.userId, "Usuario autenticado e obrigatorio.");
  assert.equal(result.errors.amount, "Valor deve ser maior que zero.");
  assert.equal(result.errors.date, "Data invalida.");
});
