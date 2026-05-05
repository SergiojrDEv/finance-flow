import assert from "node:assert/strict";
import test from "node:test";

import {
  isAdult,
  isValidCpf,
  onlyDigits,
  validateAuthInput,
  validateSignupProfile,
} from "../../../src/application/auth/validateAuth.js";

test("valida email e senha do login", () => {
  assert.equal(validateAuthInput("", ""), "Informe e-mail e senha.");
  assert.equal(validateAuthInput("email-invalido", "123456"), "Informe um e-mail valido.");
  assert.equal(validateAuthInput("user@example.com", "123"), "A senha deve ter pelo menos 6 caracteres.");
  assert.equal(validateAuthInput("user@example.com", "123456"), "");
});

test("valida CPF e idade para cadastro", () => {
  assert.equal(onlyDigits("123.456.789-09"), "12345678909");
  assert.equal(isValidCpf("123.456.789-09"), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
  assert.equal(isAdult("2008-04-24", new Date("2026-04-24T12:00:00.000Z")), true);
  assert.equal(isAdult("2008-04-25", new Date("2026-04-24T12:00:00.000Z")), false);
});

test("valida perfil completo de cadastro", () => {
  const today = new Date("2026-04-24T12:00:00.000Z");
  const profile = {
    fullName: "Sergio Junior",
    cpf: "12345678909",
    phone: "(11) 99999-9999",
    birthdate: "1990-01-01",
    email: "sergio@example.com",
    password: "123456",
  };

  assert.equal(validateSignupProfile(profile, { today }), "");
  assert.equal(validateSignupProfile({ ...profile, fullName: "Sergio" }, { today }), "Informe seu nome completo.");
  assert.equal(validateSignupProfile({ ...profile, cpf: "11111111111" }, { today }), "Informe um CPF valido.");
  assert.equal(validateSignupProfile({ ...profile, birthdate: "2012-01-01" }, { today }), "Cadastro permitido apenas para maiores de 18 anos.");
});
