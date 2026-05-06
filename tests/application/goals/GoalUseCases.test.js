import assert from "node:assert/strict";
import test from "node:test";
import { ArchiveGoalUseCase } from "../../../src/application/goals/ArchiveGoalUseCase.js";
import { CreateGoalUseCase } from "../../../src/application/goals/CreateGoalUseCase.js";
import { UpdateGoalUseCase } from "../../../src/application/goals/UpdateGoalUseCase.js";
import { LocalGoalRepository } from "../../../src/infrastructure/goals/LocalGoalRepository.js";

function createRepository(initialGoals = []) {
  let goals = [...initialGoals];
  return new LocalGoalRepository({
    readGoals: () => goals,
    writeGoals: (nextGoals) => {
      goals = nextGoals;
    },
    createId: () => "goal-1",
  });
}

test("cria meta pelo caso de uso", async () => {
  const repository = createRepository();
  const useCase = new CreateGoalUseCase({
    goalRepository: repository,
    clock: () => new Date("2026-05-06T10:00:00.000Z"),
  });

  const result = await useCase.execute({ name: "Reserva", key: "renda-fixa", target: 30000 });

  assert.equal(result.ok, true);
  assert.equal(result.value.id, "goal-1");
  assert.equal(result.value.createdAt, "2026-05-06T10:00:00.000Z");
});

test("atualiza meta preservando acumulado", async () => {
  const repository = createRepository([{ id: "goal-1", name: "Reserva", key: "renda-fixa", target: 1000, currentAmount: 200, color: "#111111" }]);
  const useCase = new UpdateGoalUseCase({ goalRepository: repository });

  const result = await useCase.execute("goal-1", { name: "Reserva nova", key: "acoes", target: 2000 });

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Reserva nova");
  assert.equal(result.value.currentAmount, 200);
  assert.equal(result.value.color, "#111111");
});

test("arquiva meta sem remover fisicamente", async () => {
  const repository = createRepository([{ id: "goal-1", name: "Reserva", key: "renda-fixa", target: 1000 }]);
  const useCase = new ArchiveGoalUseCase({ goalRepository: repository });

  const result = await useCase.execute("goal-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.isArchived, true);
});
