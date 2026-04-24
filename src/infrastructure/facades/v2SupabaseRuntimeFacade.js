export function createV2SupabaseRuntimeFacade({
  state,
  deps,
  v2SyncFacade,
  supabaseShadow,
  ensureCatalogCoversTransactions,
  fromV2Transaction,
  handleCloudError,
  renderCloudStatus,
}) {
  async function pull({ options = {} }) {
    const client = state.supabaseClient;
    const userId = state.currentUser.id;
    const [
      accountsResult,
      cardsResult,
      categoriesResult,
      tagsResult,
      budgetsResult,
      goalsResult,
      transactionsResult,
      legacyTransactionsResult,
    ] = await Promise.all([
      client.from("accounts").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("credit_cards").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("categories").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("category_tags").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("budgets").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      client.from("goals").select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      client.from("transactions_v2").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      client.from("transactions").select("id,cat,subcat,type").eq("user_id", userId),
    ]);

    const firstError = [
      accountsResult.error,
      cardsResult.error,
      categoriesResult.error,
      tagsResult.error,
      budgetsResult.error,
      goalsResult.error,
      transactionsResult.error,
      legacyTransactionsResult.error && !String(legacyTransactionsResult.error?.message || "").toLowerCase().includes("does not exist")
        && !String(legacyTransactionsResult.error?.message || "").toLowerCase().includes("could not find")
        && legacyTransactionsResult.error?.code !== "PGRST205"
        ? legacyTransactionsResult.error
        : null,
    ].find(Boolean);
    if (firstError) return handleCloudError(firstError);

    const accounts = accountsResult.data || [];
    const creditCards = cardsResult.data || [];
    const categories = categoriesResult.data || [];
    const categoryTags = tagsResult.data || [];
    const budgets = budgetsResult.data || [];
    const goals = goalsResult.data || [];
    const txRows = transactionsResult.data || [];
    const legacyRows = legacyTransactionsResult.data || [];

    if (options.silent && !txRows.length && !categories.length && state.transactions.length) {
      renderCloudStatus();
      return;
    }

    const refs = {
      accountById: new Map(accounts.map((item) => [item.id, item])),
      categoryById: new Map(categories.map((item) => [item.id, item])),
      tagById: new Map(categoryTags.map((item) => [item.id, item])),
    };

    const { legacyCatalog: legacyReadCatalog, primaryCatalog: adapterReadCatalog } = v2SyncFacade.buildCatalogReadState({
      accounts,
      creditCards,
      categories,
      categoryTags,
      budgets,
      goals,
      legacyTransactions: legacyRows,
    });
    supabaseShadow.compareCatalogRead(legacyReadCatalog, adapterReadCatalog);

    state.catalog = adapterReadCatalog;
    state.dataMode = "v2";
    deps.syncSettingsFromCatalog();
    const legacyById = new Map(legacyRows.map((item) => [item.id, item]));
    state.transactions = txRows.map((row) => fromV2Transaction(row, refs));
    state.transactions.forEach((item) => {
      const legacy = legacyById.get(item.id);
      if (!legacy) return;
      if ((item.category === "outros" || !item.category) && legacy.cat) item.category = legacy.cat;
      if (!item.subcategory && legacy.subcat) item.subcategory = legacy.subcat;
      if (!item.type && legacy.type) item.type = legacy.type;
    });
    deps.save();
    deps.updateCategoryOptions();
    deps.updateAccountOptions();
    deps.updateCreditCardOptions();
    deps.renderAll();
    renderCloudStatus();
    if (!options.silent) deps.notify("Dados baixados do Supabase.");
  }

  async function syncSettings(userId) {
    const client = state.supabaseClient;
    const catalog = ensureCatalogCoversTransactions(
      state.catalog || deps.hydrateCatalog(state.settings, state.catalog),
      state.transactions
    );
    state.catalog = catalog;
    const nowIso = new Date().toISOString();

    const {
      legacy: { accountRows: legacyAccountRows, categoryRows: legacyCategoryRows, creditCardRows: legacyCreditCardRows },
      basePayloads,
    } = v2SyncFacade.buildCatalogWriteState({
      userId,
      catalog,
      nowIso,
    });
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.accounts", legacyAccountRows, basePayloads.accountRows, ["user_id", "name", "kind", "color", "is_archived"]);
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.categories", legacyCategoryRows, basePayloads.categoryRows, ["user_id", "kind", "slug", "name", "color", "monthly_limit", "is_archived"]);
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.creditCards", legacyCreditCardRows, basePayloads.creditCardRows, ["id", "user_id", "name", "color", "closing_day", "due_day", "is_archived"]);

    const accountRows = basePayloads.accountRows;
    if (accountRows.length) {
      const { error } = await client.from("accounts").upsert(accountRows, { onConflict: "user_id,name" });
      if (error) throw error;
    }

    const { data: existingAccounts, error: accountsFetchError } = await client
      .from("accounts")
      .select("id,name,is_archived")
      .eq("user_id", userId);
    if (accountsFetchError) throw accountsFetchError;

    const activeAccountNames = new Set(catalog.accounts.map((item) => item.name.toLowerCase()));
    const staleAccountIds = (existingAccounts || [])
      .filter((item) => !activeAccountNames.has(String(item.name).toLowerCase()))
      .map((item) => item.id);
    if (staleAccountIds.length) {
      const { error } = await client.from("accounts").update({ is_archived: true, updated_at: new Date().toISOString() }).in("id", staleAccountIds);
      if (error) throw error;
    }

    const categoryRows = basePayloads.categoryRows;
    if (categoryRows.length) {
      const { error } = await client.from("categories").upsert(categoryRows, { onConflict: "user_id,kind,slug" });
      if (error) throw error;
    }

    const { data: existingCategories, error: categoriesFetchError } = await client
      .from("categories")
      .select("id,kind,slug")
      .eq("user_id", userId);
    if (categoriesFetchError) throw categoriesFetchError;

    const activeCategoryKeys = new Set(categoryRows.map((item) => `${item.kind}:${item.slug}`));
    const staleCategoryIds = (existingCategories || [])
      .filter((item) => !activeCategoryKeys.has(`${item.kind}:${item.slug}`))
      .map((item) => item.id);
    if (staleCategoryIds.length) {
      const { error } = await client.from("categories").update({ is_archived: true, updated_at: new Date().toISOString() }).in("id", staleCategoryIds);
      if (error) throw error;
    }

    const { data: freshCategories, error: freshCategoriesError } = await client
      .from("categories")
      .select("id,kind,slug,color")
      .eq("user_id", userId)
      .eq("is_archived", false);
    if (freshCategoriesError) throw freshCategoriesError;
    const categoryKeyToId = new Map((freshCategories || []).map((item) => [`${item.kind}:${item.slug}`, item]));

    const {
      legacy: { tagRows: legacyTagRows, budgetRows: legacyBudgetRows, goalRows: legacyGoalRows },
      dependentPayloads,
    } = v2SyncFacade.buildCatalogWriteState({
      userId,
      catalog,
      categoryKeyToId,
      nowIso,
    });
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.tags", legacyTagRows, dependentPayloads.tagRows, ["user_id", "category_id", "slug", "name", "color", "is_archived"]);
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.budgets", legacyBudgetRows, dependentPayloads.budgetRows, ["user_id", "category_id", "period_kind", "amount", "starts_on"]);
    supabaseShadow.compareCatalogWrite("supabase.v2CatalogWrite.goals", legacyGoalRows, dependentPayloads.goalRows, ["user_id", "name", "target_amount", "current_amount", "linked_category_id", "color"]);

    const tagRows = dependentPayloads.tagRows;
    if (tagRows.length) {
      const { error } = await client.from("category_tags").upsert(tagRows, { onConflict: "user_id,category_id,slug" });
      if (error) throw error;
    }

    const { data: existingTags, error: tagsFetchError } = await client
      .from("category_tags")
      .select("id,category_id,slug")
      .eq("user_id", userId);
    if (tagsFetchError) throw tagsFetchError;
    const activeTagKeys = new Set(tagRows.map((item) => `${item.category_id}:${item.slug}`));
    const staleTagIds = (existingTags || [])
      .filter((item) => !activeTagKeys.has(`${item.category_id}:${item.slug}`))
      .map((item) => item.id);
    if (staleTagIds.length) {
      const { error } = await client.from("category_tags").update({ is_archived: true, updated_at: new Date().toISOString() }).in("id", staleTagIds);
      if (error) throw error;
    }

    const creditCardRows = basePayloads.creditCardRows;
    if (creditCardRows.length) {
      const { error } = await client.from("credit_cards").upsert(creditCardRows, { onConflict: "id" });
      if (error) throw error;
    }

    const activeCardIds = new Set(catalog.creditCards.map((item) => item.id));
    const { data: existingCards, error: cardsFetchError } = await client
      .from("credit_cards")
      .select("id")
      .eq("user_id", userId);
    if (cardsFetchError) throw cardsFetchError;
    const staleCardIds = (existingCards || []).map((item) => item.id).filter((id) => !activeCardIds.has(id));
    if (staleCardIds.length) {
      const { error } = await client.from("credit_cards").update({ is_archived: true, updated_at: new Date().toISOString() }).in("id", staleCardIds);
      if (error) throw error;
    }

    const budgetRows = dependentPayloads.budgetRows;
    const { error: deleteBudgetsError } = await client.from("budgets").delete().eq("user_id", userId);
    if (deleteBudgetsError) throw deleteBudgetsError;
    if (budgetRows.length) {
      const { error } = await client.from("budgets").insert(budgetRows);
      if (error) throw error;
    }

    const goalRows = dependentPayloads.goalRows;
    const { error: deleteGoalsError } = await client.from("goals").delete().eq("user_id", userId);
    if (deleteGoalsError) throw deleteGoalsError;
    if (goalRows.length) {
      const { error } = await client.from("goals").insert(goalRows);
      if (error) throw error;
    }

    return {
      accounts: new Map((existingAccounts || []).map((item) => [item.name.toLowerCase(), item.id])),
      categories: categoryKeyToId,
      tags: new Map(tagRows.map((item) => [`${item.category_id}:${item.slug}`, item])),
    };
  }

  async function syncTransactions(userId, refs) {
    const client = state.supabaseClient;
    const categoryRecords = refs.categories;
    const accountNameToId = refs.accounts;

    const { data: currentTags, error: currentTagsError } = await client
      .from("category_tags")
      .select("id,category_id,slug")
      .eq("user_id", userId)
      .eq("is_archived", false);
    if (currentTagsError) throw currentTagsError;
    const tagKeyToId = new Map((currentTags || []).map((item) => [`${item.category_id}:${item.slug}`, item.id]));

    const nowIso = new Date().toISOString();
    const { legacyRows, rows } = v2SyncFacade.buildTransactionWriteState({
      userId,
      transactions: state.transactions,
      refs: {
        categories: categoryRecords,
        tags: tagKeyToId,
        accounts: accountNameToId,
      },
      nowIso,
    });
    supabaseShadow.compareTransactionWrite(legacyRows, rows);

    if (rows.length) {
      const { error } = await client.from("transactions_v2").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }

    const { data: remoteRows, error: remoteRowsError } = await client
      .from("transactions_v2")
      .select("id")
      .eq("user_id", userId);
    if (remoteRowsError) throw remoteRowsError;

    const localIds = new Set(state.transactions.map((item) => item.id));
    const idsToDelete = (remoteRows || []).map((item) => item.id).filter((id) => !localIds.has(id));
    if (idsToDelete.length) {
      const { error } = await client.from("transactions_v2").delete().eq("user_id", userId).in("id", idsToDelete);
      if (error) throw error;
    }
  }

  return {
    pull,
    syncSettings,
    syncTransactions,
  };
}
