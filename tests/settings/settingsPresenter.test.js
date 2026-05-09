import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCategoryManagerRows,
  buildGoalCardRows,
  buildGoalsSummary,
  buildSubcategoryGroups,
} from "../../src/settings/settingsPresenter.js";

test("monta linhas de categorias ignorando arquivadas", () => {
  const rows = buildCategoryManagerRows([
    { kind: "expense", slug: "moradia", name: "Moradia", color: "#0b7285", monthlyLimit: 2200 },
    { kind: "expense", slug: "old", name: "Old", isArchived: true },
  ], () => 2);

  assert.deepEqual(rows, [
    { type: "expense", key: "moradia", label: "Moradia", color: "#0b7285", limit: 2200, tagCount: 2 },
  ]);
});

test("monta cards e resumo de metas a partir dos investimentos", () => {
  const goals = [
    { name: "Reserva", key: "renda-fixa", target: 1000, currentAmount: 100 },
  ];
  const investments = [
    { type: "investment", category: "renda-fixa", amount: 250 },
  ];
  const cards = buildGoalCardRows({
    goals,
    investments,
    findCategoryName: () => "Renda fixa",
  });
  const summary = buildGoalsSummary({ goals, investments });

  assert.equal(cards[0].current, 250);
  assert.equal(cards[0].percent, 25);
  assert.equal(cards[0].categoryName, "Renda fixa");
  assert.equal(summary.totalCurrent, 250);
  assert.equal(summary.closest.name, "Reserva");
});

test("monta grupos de etiquetas ignorando categorias arquivadas", () => {
  const groups = buildSubcategoryGroups([
    { kind: "expense", slug: "alimentacao", name: "Alimentacao" },
    { kind: "expense", slug: "old", name: "Old", isArchived: true },
  ], () => [{ slug: "mercado", name: "Mercado", color: "#c43d4b" }], () => "#c43d4b");

  assert.equal(groups.length, 1);
  assert.equal(groups[0].categoryKey, "alimentacao");
  assert.deepEqual(groups[0].tags, [["mercado", "Mercado", "#c43d4b"]]);
});
