import type {
  SupabaseAuthUser,
  SupabaseClientLike,
  UserProfileRow,
} from "./syncTypes.js";

export class SupabaseUserProfileRepository {
  private readonly client: SupabaseClientLike;
  private readonly isEmailConfirmed: (user?: SupabaseAuthUser) => boolean;

  constructor({
    client,
    isEmailConfirmed,
  }: {
    client?: SupabaseClientLike;
    isEmailConfirmed?: (user?: SupabaseAuthUser) => boolean;
  } = {}) {
    if (!client) {
      throw new Error("client e obrigatorio.");
    }
    if (!isEmailConfirmed || typeof isEmailConfirmed !== "function") {
      throw new Error("isEmailConfirmed e obrigatorio.");
    }

    this.client = client;
    this.isEmailConfirmed = isEmailConfirmed;
  }

  async saveFromMetadata(user?: SupabaseAuthUser): Promise<{ skipped: true } | { skipped: false; row: UserProfileRow }> {
    if (!user?.id || !this.isEmailConfirmed(user)) return { skipped: true };

    const data = user.user_metadata || {};
    if (!data.full_name && !data.cpf && !data.phone && !data.birthdate) {
      return { skipped: true };
    }

    const row: UserProfileRow = {
      user_id: user.id,
      full_name: data.full_name || "",
      cpf: data.cpf || "",
      phone: data.phone || "",
      birthdate: data.birthdate || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.client.from("user_profiles").upsert?.(row) || { error: new Error("Supabase upsert indisponivel.") };
    if (error) throw error;

    return { skipped: false, row };
  }
}
