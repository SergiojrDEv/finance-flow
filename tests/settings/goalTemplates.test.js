import assert from "node:assert/strict";
import test from "node:test";

import { renderGoalsHtml, renderGoalsSummaryHtml } from "../../src/settings/goalTemplates.js";

test("renderiza metas e estado vazio", () => {
  const emptyHtml = renderGoalsHtml([]);
  const html = renderGoalsHtml([
    { name: "Reserva", current: 1000, target: 30000, percent: 3.33, categoryName: "Renda fixa" },
  ]);

  assert.match(emptyHtml, /Nenhuma meta criada/);
  assert.match(emptyHtml, /app-empty-state/);
  assert.match(emptyHtml, /acompanhar aportes/);
  assert.match(html, /Reserva/);
  assert.match(html, /Renda fixa/);
  assert.match(html, /data-goal-contribute="0"/);
});

test("renderiza resumo de metas", () => {
  const html = renderGoalsSummaryHtml({
    activeCount: 2,
    totalTarget: 39000,
    totalCurrent: 1000,
    closest: { name: "Reserva", progress: 3.33 },
  });

  assert.match(html, /Metas ativas/);
  assert.match(html, />2</);
  assert.match(html, /Reserva/);
  assert.match(html, /3% concluido/);
});
