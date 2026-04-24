import { buildSettingsOverview } from "../../application/catalog/buildSettingsOverview.js";

export function createSupabaseShadowFacade() {
  const shadowWarnings = new Set();

  function report(scope, payload) {
    const signature = `${scope}:${JSON.stringify(payload)}`;
    if (shadowWarnings.has(signature)) return;
    shadowWarnings.add(signature);
    console.warn(`[shadow-mode] Divergencia detectada em ${scope}`, payload);
  }

  function compareCatalogRead(currentCatalog, nextCatalog) {
    const current = buildSettingsOverview(currentCatalog);
    const next = buildSettingsOverview(nextCatalog);
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      report("supabase.v2CatalogRead", { current, next });
    }
  }

  function compareTransactionWrite(currentRows, nextRows) {
    const normalize = (rows) => rows
      .map((item) => ({
        id: item.id,
        transaction_kind: item.transaction_kind,
        status: item.status,
        description: item.description,
        amount: Number(item.amount || 0),
        transaction_date: item.transaction_date,
        due_date: item.due_date || null,
        category_id: item.category_id || null,
        category_tag_id: item.category_tag_id || null,
        account_id: item.account_id || null,
        credit_card_id: item.credit_card_id || null,
        payment_method: item.payment_method,
        recurring_rule_id: item.recurring_rule_id || null,
        installment_group_id: item.installment_group_id || null,
        installment_number: item.installment_number || null,
        installment_total: item.installment_total || null,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));

    const current = normalize(currentRows);
    const next = normalize(nextRows);
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      report("supabase.v2TransactionWrite", { current, next });
    }
  }

  function compareCatalogWrite(scope, currentRows, nextRows, fields) {
    const normalize = (rows) => rows
      .map((item) => Object.fromEntries(fields.map((field) => [field, item[field] ?? null])))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));

    const current = normalize(currentRows);
    const next = normalize(nextRows);
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      report(scope, { current, next });
    }
  }

  return {
    compareCatalogRead,
    compareTransactionWrite,
    compareCatalogWrite,
  };
}
