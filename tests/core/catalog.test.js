import test from "node:test";
import assert from "node:assert/strict";

import { buildCatalogFromSettings, buildSettingsFromCatalog } from "../../src/core/catalog.js";

test("preserva valor acumulado e cor das metas ao sincronizar catalogo e settings", () => {
  const catalog = buildCatalogFromSettings({
    accounts: ["Corretora"],
    creditCards: [],
    categories: {
      expense: [],
      income: [],
      investment: [["renda-fixa", "Renda fixa", "#635bff"]],
    },
    subcategories: {},
    goals: [
      {
        name: "Reserva",
        target: 30000,
        currentAmount: 1200,
        key: "renda-fixa",
        color: "#1971c2",
      },
    ],
    budgetRules: {},
  });

  const settings = buildSettingsFromCatalog(catalog);
  const rebuilt = buildCatalogFromSettings(settings, catalog);

  assert.equal(rebuilt.goals[0].currentAmount, 1200);
  assert.equal(rebuilt.goals[0].color, "#1971c2");
});
