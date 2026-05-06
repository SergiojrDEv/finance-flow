import assert from "node:assert/strict";
import test from "node:test";
import { createGoalServices } from "../../../src/infrastructure/composition/createGoalServices.js";

test("monta servicos de meta com repositorio local", async () => {
  let goals = [];
  const services = createGoalServices({
    readGoals: () => goals,
    writeGoals: (nextGoals) => {
      goals = nextGoals;
    },
    createId: () => "goal-1",
  });

  const result = await services.createGoal.execute({ name: "Reserva", key: "renda-fixa", target: 30000 });

  assert.equal(result.ok, true);
  assert.equal(goals.length, 1);
  assert.equal(typeof services.updateGoal.execute, "function");
  assert.equal(typeof services.archiveGoal.execute, "function");
});
