import assert from "node:assert/strict";
import test from "node:test";

import {
  renderAccountManagerHtml,
  renderCardManagerHtml,
  renderCategoryManagerHtml,
  renderGoalManagerHtml,
  renderSubcategoryManagerHtml,
} from "../../src/settings/manageTemplates.js";

test("renderiza categorias gerenciaveis com limite e acoes", () => {
  const html = renderCategoryManagerHtml([
    { type: "expense", key: "moradia", label: "Moradia", color: "#0b7285", limit: 2200, tagCount: 2 },
  ]);

  assert.match(html, /Moradia/);
  assert.match(html, /limite/);
  assert.match(html, /2 subcategorias/);
  assert.match(html, /data-edit-category="expense:moradia"/);
});

test("renderiza contas e cartoes gerenciaveis", () => {
  const accountHtml = renderAccountManagerHtml([{ name: "Carteira" }]);
  const cardHtml = renderCardManagerHtml([{ name: "Cartao principal", closingDay: 25, dueDay: 10 }]);

  assert.match(accountHtml, /Carteira/);
  assert.match(accountHtml, /data-edit-account="0"/);
  assert.match(cardHtml, /Fecha dia 25/);
  assert.match(cardHtml, /data-edit-card="0"/);
});

test("renderiza metas gerenciaveis e estado vazio", () => {
  const emptyHtml = renderGoalManagerHtml([], () => "");
  const html = renderGoalManagerHtml([
    { name: "Reserva", key: "renda-fixa", categoryLabel: "Renda fixa", target: 30000 },
  ], (selected) => `<option value="${selected}" selected>Renda fixa</option>`);

  assert.match(emptyHtml, /Nenhuma meta cadastrada/);
  assert.match(html, /Reserva/);
  assert.match(html, /data-save-goal="0"/);
});

test("renderiza etiquetas por categoria", () => {
  const html = renderSubcategoryManagerHtml([
    {
      type: "expense",
      categoryKey: "alimentacao",
      categoryLabel: "Alimentacao",
      fallbackColor: "#c43d4b",
      tags: [["mercado", "Mercado", "#c43d4b"]],
    },
  ]);

  assert.match(html, /Alimentacao/);
  assert.match(html, /Mercado/);
  assert.match(html, /data-edit-subcategory="expense:alimentacao:mercado"/);
});
