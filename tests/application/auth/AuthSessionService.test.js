import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthSessionService,
  isEmailConfirmed,
  parseAuthHashType,
  planAuthHashState,
  planAuthStateChange,
  planInitialAuthSession,
} from "../../../src/application/auth/AuthSessionService.js";

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

test("extrai tipo do hash de autenticacao", () => {
  assert.equal(parseAuthHashType("#access_token=abc&type=recovery"), "recovery");
  assert.equal(parseAuthHashType("type=signup&access_token=abc"), "signup");
  assert.equal(parseAuthHashType("#access_token=abc"), "");
  assert.equal(parseAuthHashType(""), "");
});

test("planeja estado inicial a partir do tipo do hash", () => {
  const recovery = planAuthHashState({ authHashType: "recovery" });
  const regular = planAuthHashState({ authHashType: "signup" });

  assert.equal(recovery.action, "password-recovery");
  assert.equal(recovery.isPasswordRecovery, true);
  assert.equal(recovery.view, "update-password");
  assert.equal(regular.action, "active-session");
  assert.equal(regular.isPasswordRecovery, false);
});

test("planeja sessao inicial confirmada sem acoplar renderizacao", () => {
  const user = { id: "user-1", email_confirmed_at: "2026-04-24" };

  const plan = planInitialAuthSession({ user, isEmailConfirmed });

  assert.equal(plan.action, "active-session");
  assert.equal(plan.currentUser, user);
  assert.equal(plan.shouldSaveProfile, true);
  assert.equal(plan.shouldPull, true);
  assert.equal(plan.shouldSignOut, false);
  assert.equal(plan.view, "");
});

test("planeja sessao inicial de recuperacao de senha", () => {
  const plan = planInitialAuthSession({
    isPasswordRecovery: true,
    isEmailConfirmed,
  });

  assert.equal(plan.action, "password-recovery");
  assert.equal(plan.currentUser, null);
  assert.equal(plan.isPasswordRecovery, true);
  assert.equal(plan.shouldPull, false);
  assert.equal(plan.view, "update-password");
  assert.equal(plan.authGateMessage, "Defina sua nova senha para continuar.");
});

test("planeja encerramento quando email ainda nao foi confirmado", () => {
  const plan = planInitialAuthSession({
    user: { id: "user-1" },
    isEmailConfirmed,
  });

  assert.equal(plan.action, "sign-out-unconfirmed");
  assert.equal(plan.currentUser, null);
  assert.equal(plan.shouldSignOut, true);
  assert.equal(plan.shouldPull, false);
  assert.equal(plan.authGateMessage, "Confirme seu e-mail antes de entrar.");
});

test("planeja mudancas de estado sem executar efeitos colaterais", () => {
  assert.equal(planAuthStateChange({ event: "INITIAL_SESSION" }).action, "ignore");
  assert.equal(planAuthStateChange({ event: "PASSWORD_RECOVERY" }).view, "update-password");

  const signedIn = planAuthStateChange({
    event: "SIGNED_IN",
    user: { id: "user-1", confirmed_at: "2026-04-24" },
    isEmailConfirmed,
  });

  assert.equal(signedIn.action, "active-session");
  assert.equal(signedIn.shouldPull, true);
});
