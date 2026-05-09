import assert from "node:assert/strict";
import test from "node:test";

import { renderTransactionTableHtml } from "../../src/transactions/tableTemplate.js";

const presentation = {
  amount: { className: "negative", sign: "-" },
  typeLabel: "Despesa",
  statusLabel: "Pago",
  paymentMethodLabel: "Pix",
};

test("renderiza estado vazio da tabela de lancamentos", () => {
  const html = renderTransactionTableHtml([]);

  assert.match(html, /Nenhum lancamento encontrado/);
  assert.match(html, /Cadastre um novo movimento/);
  assert.match(html, /app-empty-state/);
  assert.match(html, /table-empty-state/);
  assert.match(html, /colspan="10"/);
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
  assert.match(html, /R\$ 56/);
  assert.match(html, /data-edit="tx-1"/);
});
