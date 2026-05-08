import type { LegacyCloudSnapshotInput, LegacySyncPayload, SupabaseClientLike } from "./syncTypes.js";

export class SupabaseLegacySyncRepository {
  private readonly client: SupabaseClientLike;

  constructor({ client }: { client?: SupabaseClientLike } = {}) {
    if (!client) {
      throw new Error("client e obrigatorio.");
    }

    this.client = client;
  }

  async sync({ userId, rows = [], settings, localIds = [] }: Partial<LegacySyncPayload> = {}): Promise<{ deletedIds: unknown[] }> {
    if (!userId) throw new Error("userId e obrigatorio.");

    if (rows.length) {
      const { error } = await this.client.from("transactions").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }

    const { error: settingsError } = await this.client
      .from("finance_settings")
      .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() });
    if (settingsError) throw settingsError;

    const { data: remoteRows, error: remoteRowsError } = await this.client
      .from("transactions")
      .select("id")
      .eq("user_id", userId);
    if (remoteRowsError) throw remoteRowsError;

    const ids = new Set(localIds);
    const idsToDelete = (remoteRows || []).map((item) => item.id).filter((id) => !ids.has(id));
    if (idsToDelete.length) {
      const { error } = await this.client.from("transactions").delete().eq("user_id", userId).in("id", idsToDelete);
      if (error) throw error;
    }

    return { deletedIds: idsToDelete };
  }

  async fetch({ userId }: { userId?: string } = {}): Promise<LegacyCloudSnapshotInput> {
    if (!userId) throw new Error("userId e obrigatorio.");

    const { data: transactions, error: txError } = await this.client
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (txError) throw txError;

    const { data: settingsRow, error: settingsError } = await this.client
      .from("finance_settings")
      .select("settings")
      .eq("user_id", userId)
      .maybeSingle();
    if (settingsError) throw settingsError;

    return {
      transactions: transactions || [],
      settings: settingsRow?.settings || null,
    };
  }
}
