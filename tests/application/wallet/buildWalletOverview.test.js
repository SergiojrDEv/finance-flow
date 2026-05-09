import assert from "node:assert/strict";
import test from "node:test";
import { buildWalletOverview } from "../../../src/application/wallet/buildWalletOverview.js";

const currentDate = new Date(2026, 3, 1);

test("monta carteira a partir de contas e lancamentos locais", () => {
  const overview = buildWalletOverview({
    currentDate,
    settings: {
      accounts: ["Carteira", "Conta corrente", "Cartao de credito", "Corretora"],
      creditCards: [{ id: "card-1", name: "Cartao principal", closingDay: 25, dueDay: 10 }],
    },
    transactions: [
      { type: "income", account: "Conta corrente", amount: 3100, date: "2026-04-05" },
      { type: "expense", account: "Conta corrente", amount: 900, date: "2026-04-10", paymentMethod: "pix" },
      { type: "expense", account: "Cartao de credito", amount: 300, date: "2026-04-11", paymentMethod: "credit", creditCardId: "card-1" },
      { type: "investment", account: "Corretora", amount: 500, date: "2026-04-12" },
      { type: "expense", account: "Conta corrente", amount: 100, date: "2026-03-10", paymentMethod: "pix" },
    ],
  });

  assert.equal(overview.income, 3100);
  assert.equal(overview.expenses, 1200);
  assert.equal(overview.investments, 500);
  assert.equal(overview.available, 1400);
  assert.equal(overview.patrimony, 1900);
  assert.equal(overview.review.manualAccounts, 4);
  assert.equal(overview.creditCardRows[0].amount, 300);
  assert.deepEqual(
    overview.accountCards.map((card) => [card.name, card.tone, card.balance]),
    [
      ["Carteira", "wallet", 0],
      ["Conta corrente", "checking", 2200],
      ["Cartao de credito", "credit", 300],
      ["Corretora", "investment", 500],
    ]
  );
});

test("mantem valores zerados quando nao ha dados locais", () => {
  const overview = buildWalletOverview({
    currentDate,
    settings: {},
    transactions: [],
  });

  assert.equal(overview.patrimony, 0);
  assert.equal(overview.available, 0);
  assert.deepEqual(overview.accountCards, []);
  assert.deepEqual(overview.creditCardRows, []);
});

test("monta resumo Open Finance quando ha conexao mock e transacoes importadas", () => {
  const overview = buildWalletOverview({
    currentDate,
    settings: { accounts: [], creditCards: [] },
    transactions: [],
    openFinance: {
      connections: [{ id: "conn-1", institutionId: "nubank", institutionName: "Nubank", status: "connected" }],
      importedTransactions: [
        { id: "imp-1", connectionId: "conn-1", type: "income", amount: 4500, status: "pending_review" },
        { id: "imp-2", connectionId: "conn-1", type: "expense", amount: 300, status: "pending_review" },
        { id: "imp-3", connectionId: "conn-1", type: "expense", amount: 200, status: "matched" },
      ],
    },
  });

  assert.equal(overview.hasOpenFinance, true);
  assert.equal(overview.patrimony, 4000);
  assert.equal(overview.creditCardInUse, 500);
  assert.equal(overview.institutionRows[0].name, "Nubank");
  assert.equal(overview.review.imported, 2);
  assert.equal(overview.review.matched, 1);
});
