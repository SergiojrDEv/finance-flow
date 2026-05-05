import assert from "node:assert/strict";
import test from "node:test";

import { isUuid, planBudgetSync, planGoalSync } from "../../../src/application/sync/planCloudCatalogSync.js";

test("planeja atualizar e inserir orcamentos sem apagar antes", () => {
  const result = planBudgetSync({
    localBudgets: [
      { categoryId: "cat-food", periodKind: "weekly", amount: 200 },
      { categoryId: "cat-food", periodKind: "monthly", amount: 800 },
    ],
    remoteBudgets: [
      { id: "remote-weekly", categoryId: "cat-food", periodKind: "weekly", amount: 150 },
      { id: "remote-old", categoryId: "cat-old", periodKind: "monthly", amount: 100 },
    ],
  });

  assert.deepEqual(result.upserts.map((item) => item.action), ["update", "insert"]);
  assert.equal(result.upserts[0].remoteId, "remote-weekly");
  assert.deepEqual(result.deletes, ["remote-old"]);
});

test("planeja metas por id remoto valido", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  const result = planGoalSync({
    localGoals: [{ id, name: "Reserva", linkedCategoryId: "cat-fixed", targetAmount: 30000 }],
    remoteGoals: [{ id, name: "Reserva antiga", linkedCategoryId: "cat-old" }],
  });

  assert.equal(isUuid(id), true);
  assert.equal(result.upserts[0].action, "update");
  assert.equal(result.upserts[0].remoteId, id);
  assert.deepEqual(result.archives, []);
});

test("planeja metas locais sem uuid por nome e categoria", () => {
  const result = planGoalSync({
    localGoals: [{ id: "goal:renda-fixa:0", name: "Reserva", linkedCategoryId: "cat-fixed", targetAmount: 30000 }],
    remoteGoals: [
      { id: "remote-goal", name: "reserva", linkedCategoryId: "cat-fixed" },
      { id: "remote-stale", name: "Viagem", linkedCategoryId: "cat-funds" },
    ],
  });

  assert.equal(result.upserts[0].action, "update");
  assert.equal(result.upserts[0].remoteId, "remote-goal");
  assert.deepEqual(result.archives, ["remote-stale"]);
});
