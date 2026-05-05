import assert from "node:assert/strict";
import test from "node:test";

import { buildCategoryBreakdown } from "../../../src/application/dashboard/buildCategoryBreakdown.js";

test("monta ranking de maiores despesas por categoria", () => {
  const rows = buildCategoryBreakdown({
    categories: [
      ["moradia", "Moradia", "#0b7285"],
      ["alimentacao", "Alimentacao", "#c43d4b"],
    ],
    transactions: [
      { type: "expense", category: "alimentacao", amount: 50 },
      { type: "income", category: "salario", amount: 3000 },
      { type: "expense", category: "moradia", amount: 200 },
      { type: "expense", category: "alimentacao", amount: 75 },
    ],
  });

  assert.deepEqual(rows.map((item) => [item.key, item.value, item.width]), [
    ["moradia", 200, 100],
    ["alimentacao", 125, 62.5],
  ]);
  assert.equal(rows[0].label, "Moradia");
});

test("usa fallback para categoria ausente", () => {
  const rows = buildCategoryBreakdown({
    categories: [],
    transactions: [{ type: "expense", category: "pets", amount: 10 }],
  });

  assert.equal(rows[0].label, "pets");
  assert.equal(rows[0].color, "#667085");
});
