import { validateAuthInput, validateSignupProfile } from "./validateAuth.js";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function isEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export class AuthSessionService {
  constructor({ authClient, today } = {}) {
    if (!authClient) throw new Error("authClient e obrigatorio.");
    this.authClient = authClient;
    this.today = today;
  }

  async signIn({ email, password } = {}) {
    const validationError = validateAuthInput(email, password);
    if (validationError) return { ok: false, message: validationError };

    const { data, error } = await this.authClient.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };

    if (!isEmailConfirmed(data?.user)) {
      await this.authClient.signOut?.();
      return { ok: false, code: "email-unconfirmed", message: "Confirme seu e-mail antes de entrar." };
    }

    return { ok: true, user: data.user };
  }

  async signUp({ profile, redirectTo } = {}) {
    const validationError = validateSignupProfile(profile, { today: this.today });
    if (validationError) return { ok: false, message: validationError };

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
    if (error) return { ok: false, message: error.message };

    await this.authClient.signOut?.();
    return { ok: true, email: profile.email };
  }

  async requestPasswordReset({ email, redirectTo } = {}) {
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) return { ok: false, message: "Informe seu e-mail." };
    if (!isEmail(normalizedEmail)) return { ok: false, message: "Informe um e-mail valido." };

    const { error } = await this.authClient.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) return { ok: false, message: error.message };
    return { ok: true, email: normalizedEmail };
  }

  async updatePassword({ password, confirmPassword } = {}) {
    if (String(password || "").length < 6) {
      return { ok: false, message: "A senha deve ter pelo menos 6 caracteres." };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: "As senhas nao conferem." };
    }

    const { error } = await this.authClient.updateUser({ password });
    if (error) return { ok: false, message: error.message };
    await this.authClient.signOut?.();
    return { ok: true };
  }
}
