import assert from "node:assert/strict";
import test from "node:test";
import { buildTransactionSeries } from "../../../src/application/transactions/buildTransactionSeries.js";

let idCounter = 0;
function createId() {
  idCounter += 1;
  return `id-${idCounter}`;
}

test("cria uma despesa simples", () => {
  idCounter = 0;
  const series = buildTransactionSeries({
    type: "expense",
    createId,
    now: "2026-05-06T10:00:00.000Z",
    resolveAccount: (value) => value || "Conta corrente",
    values: {
      description: "Mercado",
      category: "alimentacao",
      account: "",
      amount: "120",
      date: "2026-05-06",
      status: "paid",
      paymentMethod: "pix",
      recurrence: "none",
    },
  });

  assert.equal(series.length, 1);
  assert.equal(series[0].account, "Conta corrente");
  assert.equal(series[0].paymentMethod, "pix");
  assert.equal(series[0].createdAt, "2026-05-06T10:00:00.000Z");
});

test("divide compra no credito em parcelas", () => {
  idCounter = 0;
  const series = buildTransactionSeries({
    type: "expense",
    createId,
    values: {
      description: "Notebook",
      category: "outros",
      account: "Cartao",
      amount: 300,
      date: "2026-05-10",
      dueDate: "2026-05-20",
      paymentMethod: "credit",
      installments: 3,
    },
  });

  assert.equal(series.length, 3);
  assert.equal(series[0].description, "Notebook (1/3)");
  assert.equal(series[1].date, "2026-06-10");
  assert.equal(series[2].dueDate, "2026-07-20");
  assert.equal(series[0].amount, 100);
  assert.equal(series[0].installmentGroup, "id-1");
});

test("cria recorrencia mensal para despesa", () => {
  idCounter = 0;
  const series = buildTransactionSeries({
    type: "expense",
    createId,
    values: {
      description: "Assinatura",
      category: "outros",
      amount: 50,
      date: "2026-05-31",
      recurrence: "monthly",
      repeatCount: 2,
    },
  });

  assert.deepEqual(series.map((item) => item.date), ["2026-05-31", "2026-06-30"]);
  assert.equal(series[0].recurrenceId, "id-1");
});

test("receita ignora campos exclusivos de despesa", () => {
  idCounter = 0;
  const series = buildTransactionSeries({
    type: "income",
    createId,
    values: {
      description: "Salario",
      category: "salario",
      amount: 3000,
      date: "2026-05-05",
      paymentMethod: "credit",
      recurrence: "monthly",
      repeatCount: 3,
      subcategory: "fixo",
    },
  });

  assert.equal(series.length, 1);
  assert.equal(series[0].paymentMethod, "transfer");
  assert.equal(series[0].subcategory, null);
  assert.equal(series[0].recurrence, "none");
});
