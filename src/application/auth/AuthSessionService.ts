import { validateAuthInput, validateSignupProfile } from "./validateAuth.js";
import { fail, ok } from "../shared/result.js";
import type { AuthClient, AuthPlan, AuthUser, SignupProfile } from "../shared/applicationTypes.js";

function isEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function isEmailConfirmed(user?: AuthUser | null): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export function parseAuthHashType(hashValue = ""): string {
  const hash = String(hashValue || "").replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("type") || "";
}

const PASSWORD_RECOVERY_MESSAGE = "Defina sua nova senha para continuar.";
const EMAIL_UNCONFIRMED_MESSAGE = "Confirme seu e-mail antes de entrar.";

function isConfirmedBy(checkEmailConfirmed: ((user: AuthUser) => boolean) | undefined, user?: AuthUser | null): boolean {
  if (!user) return false;
  if (typeof checkEmailConfirmed === "function") return checkEmailConfirmed(user);
  return isEmailConfirmed(user);
}

function buildActiveSessionPlan(user?: AuthUser | null, isPasswordRecovery = false): AuthPlan {
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

function buildPasswordRecoveryPlan(): AuthPlan {
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

function buildUnconfirmedEmailPlan(): AuthPlan {
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

export function planAuthHashState({ authHashType = "" }: { authHashType?: string } = {}): AuthPlan {
  if (authHashType === "recovery") return buildPasswordRecoveryPlan();
  return buildActiveSessionPlan(null, false);
}

export function planInitialAuthSession({
  user,
  isPasswordRecovery = false,
  isEmailConfirmed: checkEmailConfirmed,
}: {
  user?: AuthUser | null;
  isPasswordRecovery?: boolean;
  isEmailConfirmed?: (user: AuthUser) => boolean;
} = {}): AuthPlan {
  if (user && !isConfirmedBy(checkEmailConfirmed, user)) return buildUnconfirmedEmailPlan();
  if (isPasswordRecovery) return buildPasswordRecoveryPlan();
  return buildActiveSessionPlan(user, isPasswordRecovery);
}

export function planAuthStateChange({
  event,
  user,
  isPasswordRecovery = false,
  isEmailConfirmed: checkEmailConfirmed,
}: {
  event?: string;
  user?: AuthUser | null;
  isPasswordRecovery?: boolean;
  isEmailConfirmed?: (user: AuthUser) => boolean;
} = {}): AuthPlan {
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
  authClient: AuthClient;
  today?: Date;

  constructor({ authClient, today }: { authClient?: AuthClient; today?: Date } = {}) {
    if (!authClient) throw new Error("authClient e obrigatorio.");
    this.authClient = authClient;
    this.today = today;
  }

  async signIn({ email, password }: { email?: string; password?: string } = {}) {
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

  async signUp({ profile, redirectTo }: { profile?: SignupProfile; redirectTo?: string } = {}) {
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

  async requestPasswordReset({ email, redirectTo }: { email?: string; redirectTo?: string } = {}) {
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

  async updatePassword({ password, confirmPassword }: { password?: string; confirmPassword?: string } = {}) {
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
