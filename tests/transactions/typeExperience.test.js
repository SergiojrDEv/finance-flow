import assert from "node:assert/strict";
import test from "node:test";

import { getTypeExperience } from "../../src/transactions/typeExperience.js";

test("retorna textos especificos para receita", () => {
  const experience = getTypeExperience("income");

  assert.equal(experience.formTitle, "Nova receita");
  assert.equal(experience.submitLabel, "Salvar receita");
  assert.equal(experience.tone, "income");
  assert.match(experience.guideText, /aumentam o disponivel/);
  assert.match(experience.heroCopy, /sem carregar campos/);
});

test("retorna textos especificos para investimento", () => {
  const experience = getTypeExperience("investment");

  assert.equal(experience.formTitle, "Novo investimento");
  assert.equal(experience.submitLabel, "Salvar investimento");
  assert.equal(experience.tone, "investment");
  assert.match(experience.guideText, /reduzem o disponivel imediato/);
  assert.match(experience.heroCopy, /sem campos de pagamento/);
});

test("usa despesa como fallback", () => {
  const experience = getTypeExperience("unknown");

  assert.equal(experience.formTitle, "Nova despesa");
  assert.equal(experience.submitLabel, "Salvar despesa");
  assert.equal(experience.tone, "expense");
});
