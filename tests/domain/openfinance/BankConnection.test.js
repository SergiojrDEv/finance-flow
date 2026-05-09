import assert from "node:assert/strict";
import test from "node:test";
import { BankConnection } from "../../../src/domain/openfinance/BankConnection.js";

test("cria conexao bancaria imutavel e normalizada", () => {
  const result = BankConnection.create({
    userId: " user-1 ",
    provider: " mock ",
    institutionId: " bank-1 ",
    institutionName: " Banco Mock ",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.userId, "user-1");
  assert.equal(result.value.provider, "mock");
  assert.equal(result.value.institutionName, "Banco Mock");
  assert.equal(result.value.status, "connected");
  assert.equal(Object.isFrozen(result.value), true);
});

test("recusa conexao bancaria sem dados obrigatorios", () => {
  const result = BankConnection.create({});

  assert.equal(result.ok, false);
  assert.equal(result.errors.userId, "Usuario e obrigatorio.");
  assert.equal(result.errors.provider, "Provider e obrigatorio.");
});
