import { buildCatalogFromV2, ensureCatalogCoversTransactions } from "../../core/catalog.js";
import { createV2CatalogReadAdapter } from "../adapters/v2CatalogReadAdapter.js";
import { createV2CatalogWriteAdapter } from "../adapters/v2CatalogWriteAdapter.js";
import { createV2TransactionWriteAdapter } from "../adapters/v2TransactionWriteAdapter.js";

export function createV2SyncFacade({ inferAccountKind }) {
  const v2CatalogReadAdapter = createV2CatalogReadAdapter();
  const v2CatalogWriteAdapter = createV2CatalogWriteAdapter();
  const v2TransactionWriteAdapter = createV2TransactionWriteAdapter();

  function buildCatalogReadState(payload) {
    const legacyCatalog = ensureCatalogCoversTransactions(
      buildCatalogFromV2({
        accounts: payload.accounts,
        creditCards: payload.creditCards,
        categories: payload.categories,
        categoryTags: payload.categoryTags,
        budgets: payload.budgets,
        goals: payload.goals,
      }),
      payload.legacyTransactions || []
    );

    const primaryCatalog = v2CatalogReadAdapter.fromSupabasePayload(payload);

    return {
      legacyCatalog,
      primaryCatalog,
    };
  }

  function buildCatalogWriteState({ userId, catalog, nowIso, categoryKeyToId }) {
    const legacy = {
      accountRows: catalog.accounts.map((account) => ({
        user_id: userId,
        name: account.name,
        kind: account.kind || inferAccountKind(account.name),
        color: account.color || "#0b7285",
        is_archived: false,
        updated_at: nowIso,
      })),
      categoryRows: catalog.categories.map((item) => ({
        user_id: userId,
        kind: item.kind,
        slug: item.slug,
        name: item.name,
        color: item.color || "#667085",
        monthly_limit: item.kind === "expense" ? Number(item.monthlyLimit || 0) : null,
        is_archived: false,
        updated_at: nowIso,
      })),
      creditCardRows: catalog.creditCards.map((card) => ({
        id: card.id,
        user_id: userId,
        name: card.name,
        color: card.color || "#635bff",
        closing_day: Number(card.closingDay || 25),
        due_day: Number(card.dueDay || 10),
        is_archived: false,
        updated_at: nowIso,
      })),
      tagRows: categoryKeyToId
        ? catalog.tags.flatMap((item) => {
            const category = categoryKeyToId.get(`${item.kind}:${item.categorySlug}`);
            if (!category) return [];
            return [{
              user_id: userId,
              category_id: category.id,
              slug: item.slug,
              name: item.name,
              color: item.color || category.color || "#667085",
              is_archived: false,
              updated_at: nowIso,
            }];
          })
        : [],
      budgetRows: categoryKeyToId
        ? catalog.budgets.flatMap((item) => {
            const category = categoryKeyToId.get(`expense:${item.categorySlug}`);
            if (!category) return [];
            return [{
              user_id: userId,
              category_id: category.id,
              period_kind: item.periodKind,
              amount: Number(item.amount || 0),
              starts_on: nowIso.slice(0, 10),
              updated_at: nowIso,
            }];
          })
        : [],
      goalRows: categoryKeyToId
        ? catalog.goals.map((goal) => ({
            user_id: userId,
            name: goal.name,
            target_amount: Number(goal.target || 0),
            current_amount: Number(goal.currentAmount || 0),
            linked_category_id: categoryKeyToId.get(`investment:${goal.key}`)?.id || null,
            color: goal.color || "#635bff",
            updated_at: nowIso,
          }))
        : [],
    };

    const basePayloads = v2CatalogWriteAdapter.buildBasePayloads({
      userId,
      catalog,
      nowIso,
      inferAccountKind,
    });

    const dependentPayloads = categoryKeyToId
      ? v2CatalogWriteAdapter.buildDependentPayloads({
          userId,
          catalog,
          categoryKeyToId,
          nowIso,
        })
      : { tagRows: [], budgetRows: [], goalRows: [] };

    return {
      legacy,
      basePayloads,
      dependentPayloads,
    };
  }

  function buildTransactionWriteState({ userId, transactions, refs, nowIso }) {
    const legacyRows = transactions.map((item) => {
      const category = refs.categories.get(`${item.type}:${item.category}`);
      const categoryId = category?.id || null;
      const categoryTagId = categoryId && item.subcategory ? refs.tags.get(`${categoryId}:${item.subcategory}`) || null : null;
      return {
        id: item.id,
        user_id: userId,
        transaction_kind: item.type,
        status: item.status || "paid",
        description: item.description,
        amount: Number(item.amount),
        transaction_date: item.date,
        due_date: item.dueDate || item.date,
        category_id: categoryId,
        category_tag_id: categoryTagId,
        account_id: refs.accounts.get(String(item.account || "Conta corrente").toLowerCase()) || null,
        credit_card_id: item.creditCardId || null,
        payment_method: item.paymentMethod || "pix",
        recurring_rule_id: item.recurrenceId || null,
        installment_group_id: item.installmentGroup || null,
        installment_number: item.installmentNumber || null,
        installment_total: item.installmentTotal || null,
        created_at: item.createdAt || nowIso,
        updated_at: nowIso,
      };
    });

    const rows = v2TransactionWriteAdapter.fromLegacyTransactions({
      userId,
      transactions,
      refs,
      nowIso,
    });

    return {
      legacyRows,
      rows,
    };
  }

  return {
    buildCatalogReadState,
    buildCatalogWriteState,
    buildTransactionWriteState,
  };
}
