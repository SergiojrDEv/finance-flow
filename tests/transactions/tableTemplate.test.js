import assert from "node:assert/strict";
import test from "node:test";

import { renderTransactionTableHtml } from "../../src/transactions/tableTemplate.js";

const presentation = {
  amount: { className: "negative", sign: "-" },
  typeLabel: "Despesa",
  statusLabel: "Pago",
  paymentMethodLabel: "Pix",
  flowLabel: "Pix",
  originLabel: "Manual",
};

test("renderiza estado vazio da tabela de lancamentos", () => {
  const html = renderTransactionTableHtml([]);

  assert.match(html, /Nenhum lancamento encontrado/);
  assert.match(html, /Cadastre um novo movimento/);
  assert.match(html, /app-empty-state/);
  assert.match(html, /table-empty-state/);
  assert.match(html, /colspan="11"/);
});

test("renderiza linha de lancamento com helpers injetados", () => {
  const html = renderTransactionTableHtml([
    {
      id: "tx-1",
      type: "expense",
      status: "paid",
      paymentMethod: "pix",
      date: "2026-04-23",
      dueDate: "2026-04-30",
      description: "Mercado <script>",
      account: "Carteira",
      amount: 56,
      presentation,
    },
  ], {
    formatDate: (value) => `data:${value}`,
    formatMoney: (value) => `R$ ${value}`,
    formatCategoryLabel: () => "Alimentacao / Mercado",
  });

  assert.match(html, /data:2026-04-23/);
  assert.match(html, /Mercado &lt;script&gt;/);
  assert.match(html, /Alimentacao \/ Mercado/);
  assert.match(html, /transaction-row transaction-row-expense/);
  assert.match(html, /payment-pill expense/);
  assert.match(html, /source-pill source-manual/);
  assert.match(html, />Manual</);
  assert.match(html, /R\$ 56/);
  assert.match(html, /data-edit="tx-1"/);
});

test("renderiza fluxo de receita e investimento sem parecer pagamento", () => {
  const html = renderTransactionTableHtml([
    {
      id: "tx-2",
      type: "income",
      status: "paid",
      paymentMethod: "transfer",
      date: "2026-04-23",
      description: "Salario",
      account: "Conta corrente",
      amount: 3100,
      presentation: {
        amount: { className: "positive", sign: "+" },
        typeLabel: "Receita",
        statusLabel: "Pago",
        paymentMethodLabel: "Transferencia",
        flowLabel: "Entrada",
        originLabel: "Manual",
      },
    },
    {
      id: "tx-3",
      type: "investment",
      status: "paid",
      paymentMethod: "transfer",
      date: "2026-04-24",
      description: "Tesouro",
      account: "Corretora",
      amount: 500,
      presentation: {
        amount: { className: "purple", sign: "-" },
        typeLabel: "Investimento",
        statusLabel: "Pago",
        paymentMethodLabel: "Transferencia",
        flowLabel: "Aporte",
        originLabel: "Banco",
      },
      origin: "open_finance",
    },
  ]);

  assert.match(html, /payment-pill income">Entrada/);
  assert.match(html, /payment-pill investment">Aporte/);
  assert.match(html, /transaction-row-income/);
  assert.match(html, /transaction-row-investment/);
  assert.match(html, /source-open_finance/);
  assert.match(html, />Banco</);
});
