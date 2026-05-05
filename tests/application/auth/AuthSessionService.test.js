import assert from "node:assert/strict";
import test from "node:test";
import { AuthSessionService, isEmailConfirmed } from "../../../src/application/auth/AuthSessionService.js";

function createAuthClient(overrides = {}) {
  const calls = [];
  const client = {
    calls,
    async signInWithPassword(payload) {
      calls.push(["signInWithPassword", payload]);
      return { data: { user: { id: "user-1", email_confirmed_at: "2026-04-24T10:00:00.000Z" } }, error: null };
    },
    async signUp(payload) {
      calls.push(["signUp", payload]);
      return { data: {}, error: null };
    },
    async resetPasswordForEmail(email, options) {
      calls.push(["resetPasswordForEmail", email, options]);
      return { data: {}, error: null };
    },
    async updateUser(payload) {
      calls.push(["updateUser", payload]);
      return { data: {}, error: null };
    },
    async signOut() {
      calls.push(["signOut"]);
      return { error: null };
    },
    ...overrides,
  };
  return client;
}

test("entra somente quando email esta confirmado", async () => {
  const authClient = createAuthClient();
  const service = new AuthSessionService({ authClient });

  const result = await service.signIn({ email: "sergio@example.com", password: "123456" });

  assert.equal(result.ok, true);
  assert.equal(result.user.id, "user-1");
  assert.deepEqual(authClient.calls[0], ["signInWithPassword", { email: "sergio@example.com", password: "123456" }]);
});

test("recusa login sem email confirmado e encerra sessao", async () => {
  const authClient = createAuthClient({
    async signInWithPassword(payload) {
      this.calls.push(["signInWithPassword", payload]);
      return { data: { user: { id: "user-1" } }, error: null };
    },
  });
  const service = new AuthSessionService({ authClient });

  const result = await service.signIn({ email: "sergio@example.com", password: "123456" });

  assert.equal(result.ok, false);
  assert.equal(result.code, "email-unconfirmed");
  assert.equal(authClient.calls.at(-1)[0], "signOut");
});

test("cria conta com metadados e encerra sessao aguardando confirmacao", async () => {
  const authClient = createAuthClient();
  const service = new AuthSessionService({
    authClient,
    today: new Date("2026-04-24T12:00:00.000Z"),
  });
  const profile = {
    fullName: "Sergio Junior",
    cpf: "12345678909",
    phone: "(11) 99999-9999",
    birthdate: "1990-01-01",
    email: "sergio@example.com",
    password: "123456",
  };

  const result = await service.signUp({ profile, redirectTo: "https://app.test/" });

  assert.equal(result.ok, true);
  assert.equal(authClient.calls[0][0], "signUp");
  assert.equal(authClient.calls[0][1].options.emailRedirectTo, "https://app.test/");
  assert.equal(authClient.calls[0][1].options.data.full_name, "Sergio Junior");
  assert.equal(authClient.calls.at(-1)[0], "signOut");
});

test("solicita recuperacao e atualiza senha com validacao local", async () => {
  const authClient = createAuthClient();
  const service = new AuthSessionService({ authClient });

  const reset = await service.requestPasswordReset({ email: " sergio@example.com ", redirectTo: "https://app.test/" });
  const weakPassword = await service.updatePassword({ password: "123", confirmPassword: "123" });
  const update = await service.updatePassword({ password: "123456", confirmPassword: "123456" });

  assert.equal(reset.ok, true);
  assert.equal(authClient.calls[0][0], "resetPasswordForEmail");
  assert.equal(authClient.calls[0][1], "sergio@example.com");
  assert.equal(weakPassword.ok, false);
  assert.equal(update.ok, true);
  assert.equal(authClient.calls.at(-1)[0], "signOut");
});

test("detecta usuarios confirmados por ambos campos do Supabase", () => {
  assert.equal(isEmailConfirmed({ email_confirmed_at: "2026-04-24" }), true);
  assert.equal(isEmailConfirmed({ confirmed_at: "2026-04-24" }), true);
  assert.equal(isEmailConfirmed({}), false);
});
