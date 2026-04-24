import { mapTransactionToV2Row, mapV2RowToTransaction } from "../mappers/transactionMapper.js";

export function createSupabaseTransactionRepository(client) {
  async function listByMonth(userId, year, month) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0);
    const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const result = await client
      .from("transactions_v2")
      .select("*")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lte("transaction_date", end)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
    return (result.data || []).map(mapV2RowToTransaction);
  }

  async function saveMany(items) {
    if (!items.length) return;
    const result = await client.from("transactions_v2").upsert(items.map(mapTransactionToV2Row));
    if (result.error) throw result.error;
  }

  async function removeMissing(userId, keepIds) {
    let query = client.from("transactions_v2").delete().eq("user_id", userId);
    if (keepIds.length) {
      const serializedIds = keepIds.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(",");
      query = query.not("id", "in", `(${serializedIds})`);
    }
    const result = await query;
    if (result.error) throw result.error;
  }

  return {
    listByMonth,
    saveMany,
    removeMissing,
  };
}
