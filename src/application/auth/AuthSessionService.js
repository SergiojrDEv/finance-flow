import { validateAuthInput, validateSignupProfile } from "./validateAuth.js";
import { fail, ok } from "../shared/result.js";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function isEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export function parseAuthHashType(hashValue = "") {
  const hash = String(hashValue || "").replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("type") || "";
}

const PASSWORD_RECOVERY_MESSAGE = "Defina sua nova senha para continuar.";
const EMAIL_UNCONFIRMED_MESSAGE = "Confirme seu e-mail antes de entrar.";

function isConfirmedBy(checkEmailConfirmed, user) {
  if (!user) return false;
  if (typeof checkEmailConfirmed === "function") return checkEmailConfirmed(user);
  return isEmailConfirmed(user);
}

function buildActiveSessionPlan(user, isPasswordRecovery = false) {
  return {
    action: "active-session",
    authGateMessage: "",
    currentUser: user || null,
    isPasswordRecovery: Boolean(isPasswordRecovery),
    shouldPull: Boolean(user),
    shouldSaveProfile: Boolean(user),
    shouldSignOut: false,
    view: "",
  };
}

function buildPasswordRecoveryPlan() {
  return {
    action: "password-recovery",
    authGateMessage: PASSWORD_RECOVERY_MESSAGE,
    currentUser: null,
    isPasswordRecovery: true,
    shouldPull: false,
    shouldSaveProfile: false,
    shouldSignOut: false,
    view: "update-password",
  };
}

function buildUnconfirmedEmailPlan() {
  return {
    action: "sign-out-unconfirmed",
    authGateMessage: EMAIL_UNCONFIRMED_MESSAGE,
    currentUser: null,
    isPasswordRecovery: false,
    shouldPull: false,
    shouldSaveProfile: false,
    shouldSignOut: true,
    view: "",
  };
}

export function planInitialAuthSession({
  user,
  isPasswordRecovery = false,
  isEmailConfirmed: checkEmailConfirmed,
} = {}) {
  if (user && !isConfirmedBy(checkEmailConfirmed, user)) return buildUnconfirmedEmailPlan();
  if (isPasswordRecovery) return buildPasswordRecoveryPlan();
  return buildActiveSessionPlan(user, isPasswordRecovery);
}

export function planAuthStateChange({
  event,
  user,
  isPasswordRecovery = false,
  isEmailConfirmed: checkEmailConfirmed,
} = {}) {
  if (event === "INITIAL_SESSION") {
    return {
      action: "ignore",
      authGateMessage: "",
      currentUser: null,
      isPasswordRecovery: Boolean(isPasswordRecovery),
      shouldPull: false,
      shouldSaveProfile: false,
      shouldSignOut: false,
      view: "",
    };
  }

  if (event === "PASSWORD_RECOVERY") return buildPasswordRecoveryPlan();
  if (user && !isConfirmedBy(checkEmailConfirmed, user)) return buildUnconfirmedEmailPlan();
  if (isPasswordRecovery) return buildPasswordRecoveryPlan();
  return buildActiveSessionPlan(user, isPasswordRecovery);
}

export class AuthSessionService {
  constructor({ authClient, today } = {}) {
    if (!authClient) throw new Error("authClient e obrigatorio.");
    this.authClient = authClient;
    this.today = today;
  }

  async signIn({ email, password } = {}) {
    const validationError = validateAuthInput(email, password);
    if (validationError) return fail({ auth: validationError }, { message: validationError });

    const { data, error } = await this.authClient.signInWithPassword({ email, password });
    if (error) return fail({ auth: error.message }, { message: error.message });

    if (!isEmailConfirmed(data?.user)) {
      await this.authClient.signOut?.();
      const message = "Confirme seu e-mail antes de entrar.";
      return fail({ auth: message }, { code: "email-unconfirmed", message });
    }

    return ok(data.user, { user: data.user });
  }

  async signUp({ profile, redirectTo } = {}) {
    const validationError = validateSignupProfile(profile, { today: this.today });
    if (validationError) return fail({ auth: validationError }, { message: validationError });

    const { error } = await this.authClient.signUp({
      email: profile.email,
      password: profile.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: profile.fullName,
          cpf: profile.cpf,
          phone: profile.phone,
          birthdate: profile.birthdate,
        },
      },
    });
    if (error) return fail({ auth: error.message }, { message: error.message });

    await this.authClient.signOut?.();
    return ok(profile.email, { email: profile.email });
  }

  async requestPasswordReset({ email, redirectTo } = {}) {
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      const message = "Informe seu e-mail.";
      return fail({ email: message }, { message });
    }
    if (!isEmail(normalizedEmail)) {
      const message = "Informe um e-mail valido.";
      return fail({ email: message }, { message });
    }

    const { error } = await this.authClient.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) return fail({ auth: error.message }, { message: error.message });
    return ok(normalizedEmail, { email: normalizedEmail });
  }

  async updatePassword({ password, confirmPassword } = {}) {
    if (String(password || "").length < 6) {
      const message = "A senha deve ter pelo menos 6 caracteres.";
      return fail({ password: message }, { message });
    }
    if (password !== confirmPassword) {
      const message = "As senhas nao conferem.";
      return fail({ confirmPassword: message }, { message });
    }

    const { error } = await this.authClient.updateUser({ password });
    if (error) return fail({ auth: error.message }, { message: error.message });
    await this.authClient.signOut?.();
    return ok(null);
  }
}
