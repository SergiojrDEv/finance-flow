import { state } from "../core/state.js";
import {
  createId,
  esc,
  getBudgetRule,
  getCategoryColorFromList,
  money,
  safeCssColor,
  slugify,
} from "../core/utils.js";
import { firstErrorMessage } from "../application/shared/result.js";
import { createBudgetServices } from "../infrastructure/composition/createBudgetServices.js";
import { createCatalogServices } from "../infrastructure/composition/createCatalogServices.js";
import { createGoalServices } from "../infrastructure/composition/createGoalServices.js";
import { renderGoalsHtml, renderGoalsSummaryHtml } from "./goalTemplates.js";
import {
  renderAccountManagerHtml,
  renderCardManagerHtml,
  renderCategoryManagerHtml,
  renderGoalManagerHtml,
  renderSubcategoryManagerHtml,
} from "./manageTemplates.js";
import {
  buildCategoryManagerRows,
  buildGoalCardRows,
  buildGoalsSummary,
  buildSubcategoryGroups,
} from "./settingsPresenter.js";
import { createSettingsDom } from "./settingsDom.js";

export function createSettingsModule(deps) {
  const dom = createSettingsDom();
  let budgetServices = null;
  let catalogServices = null;
  let goalServices = null;

  function getBudgetServices() {
    if (budgetServices) return budgetServices;
    budgetServices = createBudgetServices({
      readBudgets: () => getCatalog().budgets || [],
      writeBudgets: (nextBudgets) => {
        getCatalog().budgets = nextBudgets;
      },
    });
    return budgetServices;
  }

  function getCatalogServices() {
    if (catalogServices) return catalogServices;
    catalogServices = createCatalogServices({
      readCategories: () => getCatalog().categories || [],
      writeCategories: (nextCategories) => {
        getCatalog().categories = nextCategories;
      },
      readTags: () => getCatalog().tags || [],
      writeTags: (nextTags) => {
        getCatalog().tags = nextTags;
      },
      createCategoryId: () => createId(),
      createTagId: () => createId(),
    });
    return catalogServices;
  }

  function getGoalServices() {
    if (goalServices) return goalServices;
    goalServices = createGoalServices({
      readGoals: () => getCatalog().goals || [],
      writeGoals: (nextGoals) => {
        getCatalog().goals = nextGoals;
      },
      createId,
    });
    return goalServices;
  }

  function getCatalog() {
    return state.catalog || deps.hydrateCatalog(state.settings, state.catalog);
  }

  function getCategoriesByType(type) {
    return getCatalog().categories.filter((item) => item.kind === type && !item.isArchived);
  }

  function getCategoryRecord(type, slug) {
    return getCategoriesByType(type).find((item) => item.slug === slug) || null;
  }

  function getAccounts() {
    return getCatalog().accounts.filter((item) => !item.isArchived);
  }

  function getAccountRecord(index) {
    return getAccounts()[index] || null;
  }

  function getCards() {
    return getCatalog().creditCards.filter((item) => !item.isArchived);
  }

  function getCardRecord(index) {
    return getCards()[index] || null;
  }

  function getGoals() {
    return getCatalog().goals.filter((item) => !item.isArchived);
  }

  function getGoalRecord(index) {
    return getGoals()[index] || null;
  }

  function getTags(type, categorySlug) {
    return getCatalog().tags.filter((item) => item.kind === type && item.categorySlug === categorySlug && !item.isArchived);
  }

  function getTagRecord(type, categorySlug, slug) {
    return getTags(type, categorySlug).find((item) => item.slug === slug) || null;
  }

  function getBudgetValue(categorySlug, periodKind) {
    const budget = getCatalog().budgets.find((item) => item.categorySlug === categorySlug && item.periodKind === periodKind);
    return Number(budget?.amount || 0);
  }

  function upsertBudget(categorySlug, periodKind, amount) {
    const catalog = getCatalog();
    const current = catalog.budgets.find((item) => item.categorySlug === categorySlug && item.periodKind === periodKind);
    if (current) {
      current.amount = Number(amount || 0);
      return;
    }
    catalog.budgets.push({
      id: `${categorySlug}:${periodKind}`,
      categorySlug,
      periodKind,
      amount: Number(amount || 0),
    });
  }

  function commitCatalogChanges(message) {
    deps.syncSettingsFromCatalog();
    deps.persist();
    deps.updateCategoryOptions();
    deps.updateAccountOptions();
    deps.updateCreditCardOptions();
    deps.updateTransactionModalAccounts();
    deps.updateTransactionModalCategories(state.transactionModalType);
    deps.renderAll();
    if (message) deps.notify(message);
  }

  function renderGoals() {
    const investments = state.transactions.filter((item) => item.type === "investment");
    const rows = buildGoalCardRows({
      goals: getGoals(),
      investments,
      findCategoryName: (key) => (getCategoryRecord("investment", key) || { name: key }).name,
    });

    dom.html("#goals-list", renderGoalsHtml(rows));
  }

  function renderGoalsSummary() {
    const target = dom.get("#goals-summary");
    if (!target) return;

    const investments = state.transactions.filter((item) => item.type === "investment");
    dom.html("#goals-summary", renderGoalsSummaryHtml(buildGoalsSummary({
      goals: getGoals(),
      investments,
    })));
  }

  function openGoalContribution(index) {
    const goal = getGoalRecord(index);
    if (!goal) return;
    location.hash = "novo-lancamento";
    deps.setSectionFromHash();
    deps.setActiveType("investment");
    deps.updateCategoryOptions();
    document.querySelector("#category").value = goal.key;
    const accountNames = getAccounts().map((item) => item.name);
    document.querySelector("#account").value = accountNames.includes("Corretora") ? "Corretora" : accountNames[0];
    document.querySelector("#payment-method").value = "transfer";
    deps.updateCreditPaymentFields();
    document.querySelector("#description").value = `Aporte - ${goal.name}`;
    document.querySelector("#amount").value = "";
    document.querySelector("#description").focus();
    document.querySelector("#transaction-form").scrollIntoView({ behavior: "smooth", block: "start" });
    deps.notify(`Preencha o valor para lancar aporte em ${goal.name}.`);
  }

  function editGoalFromCard(index) {
    const goal = getGoalRecord(index);
    if (!goal) return;
    state.activeGoalEditIndex = index;
    dom.setValue("#goal-modal-name", goal.name);
    dom.setValue("#goal-modal-category", goal.key);
    dom.setValue("#goal-modal-target", Number(goal.target) || 0);
    dom.showModal("#goal-modal-overlay");
    dom.focus("#goal-modal-name");
  }

  function closeGoalModal() {
    state.activeGoalEditIndex = null;
    dom.reset("#goal-modal-form");
    dom.hideModal("#goal-modal-overlay");
  }

  async function saveGoalFromModal(event) {
    event.preventDefault();
    const index = state.activeGoalEditIndex;
    const goal = getGoalRecord(index);
    if (!goal) return closeGoalModal();

    const name = dom.value("#goal-modal-name").trim();
    const key = dom.value("#goal-modal-category");
    const target = dom.numberValue("#goal-modal-target");
    if (!name || target <= 0) return deps.notify("Preencha a meta corretamente.");

    const result = await getGoalServices().updateGoal.execute(goal.id, { name, key, target });
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar a meta."));
      return;
    }

    commitCatalogChanges("Meta atualizada.");
    closeGoalModal();
  }

  function renderSettings() {
    renderManagePanels();
    renderCategoryManager();
    renderAccountManager();
    renderCardManager();
    renderGoalManager();
    renderSubcategoryManager();
    renderGoalCategoryOptions();
    renderSubcategoryParentOptions();
    deps.updateTransactionModalAccounts();
    deps.updateCreditCardOptions();
  }

  function renderManagePanels() {
    dom.getAll(".manage-tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.manageView === state.manageView);
    });
    dom.getAll(".manage-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.managePanel === state.manageView);
    });
  }

  function renderCategoryManager() {
    const rows = buildCategoryManagerRows(
      getCatalog().categories,
      (type, key) => getTags(type, key).length
    );
    dom.html("#category-manage-list", renderCategoryManagerHtml(rows));
  }

  function renderAccountManager() {
    dom.html("#account-manage-list", renderAccountManagerHtml(getAccounts()));
  }

  function renderCardManager() {
    dom.html("#card-manage-list", renderCardManagerHtml(getCards()));
  }

  function renderGoalManager() {
    const goals = getGoals();
    const categoryOptions = (selected) => getCategoriesByType("investment")
      .map((item) => `<option value="${esc(item.slug)}"${item.slug === selected ? " selected" : ""}>${esc(item.name)}</option>`)
      .join("");
    const rows = goals.map((goal) => ({
      ...goal,
      categoryLabel: getCategoryRecord("investment", goal.key)?.name || goal.key,
    }));

    dom.html("#goal-manage-list", renderGoalManagerHtml(rows, categoryOptions));
  }

  function renderGoalCategoryOptions() {
    const options = getCategoriesByType("investment")
      .map((item) => `<option value="${esc(item.slug)}">${esc(item.name)}</option>`)
      .join("");
    const selects = [dom.get("#new-goal-category"), dom.get("#goal-modal-category")].filter(Boolean);
    selects.forEach((select) => {
      const currentValue = select.value;
      select.innerHTML = options;
      if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  function renderSubcategoryParentOptions() {
    const type = dom.value("#new-subcategory-type", "expense") || "expense";
    const select = dom.get("#new-subcategory-category");
    if (!select) return;
    select.innerHTML = getCategoriesByType(type)
      .map((item) => `<option value="${esc(item.slug)}">${esc(item.name)}</option>`)
      .join("");
  }

  function renderSubcategoryManager() {
    const target = dom.get("#subcategory-manage-list");
    if (!target) return;
    const groups = buildSubcategoryGroups(
      getCatalog().categories,
      getTags,
      (type, key) => getCategoryColorFromList(type, key, state.settings.categories)
    );

    dom.html("#subcategory-manage-list", renderSubcategoryManagerHtml(groups));
  }

  async function addInlineSubcategory(type, categoryKey, name) {
    const normalized = name.trim();
    if (!normalized) return deps.notify("Informe um nome para a etiqueta.");
    const key = slugify(normalized);
    const color = getCategoryColorFromList(type, categoryKey, state.settings.categories);

    const result = await getCatalogServices().createCategoryTag.execute({
      kind: type,
      categorySlug: categoryKey,
      slug: key,
      name: normalized,
      color,
    });

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel criar a etiqueta."));
      return;
    }

    commitCatalogChanges("Etiqueta adicionada.");
  }

  function openSettingsItemModal(config) {
    state.settingsItemEdit = config;
    dom.text("#settings-item-modal-kicker", config.kicker);
    dom.text("#settings-item-modal-title", config.title);
    dom.setValue("#settings-item-modal-name", config.name || "");
    dom.setValue("#settings-item-modal-color", config.color || "#0b7285");
    dom.setValue("#settings-item-modal-limit", Number(config.limit || 0));
    dom.setValue("#settings-item-modal-closing", Number(config.closingDay || 25));
    dom.setValue("#settings-item-modal-due", Number(config.dueDay || 10));
    const showColor = config.kind === "category" || config.kind === "tag";
    dom.setHidden("#settings-item-modal-category-fields", !showColor && config.kind !== "category");
    dom.setHidden("#settings-item-modal-color-field", !showColor);
    dom.setHidden("#settings-item-modal-limit-field", config.kind !== "category");
    dom.setHidden("#settings-item-modal-card-fields", config.kind !== "card");
    dom.showModal("#settings-item-modal-overlay");
    dom.focus("#settings-item-modal-name");
  }

  function closeSettingsItemModal() {
    state.settingsItemEdit = null;
    dom.hideModal("#settings-item-modal-overlay");
  }

  async function saveSettingsItemFromModal(event) {
    event.preventDefault();
    const edit = state.settingsItemEdit;
    if (!edit) return closeSettingsItemModal();

    const name = dom.value("#settings-item-modal-name").trim();
    if (!name) return deps.notify("Informe um nome valido.");

    if (edit.kind === "category") {
      const item = getCategoryRecord(edit.type, edit.key);
      if (!item) return closeSettingsItemModal();
      const color = dom.value("#settings-item-modal-color");
      const monthly = Math.max(0, dom.numberValue("#settings-item-modal-limit") || 0);
      const result = await getCatalogServices().updateCategory.execute(item.id, {
        name,
        color,
        monthlyLimit: edit.type === "expense" ? monthly : null,
      });
      if (!result.ok) {
        deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar a categoria."));
        return;
      }
      if (edit.type === "expense") {
        const budgetResult = await getBudgetServices().upsertCategoryBudget.execute({
          categorySlug: edit.key,
          weeklyLimit: getBudgetRule(edit.key).weekly || (monthly ? monthly / 4 : 0),
          monthlyLimit: monthly,
        });
        if (!budgetResult.ok) {
          deps.notify(firstErrorMessage(budgetResult.errors, "Nao foi possivel atualizar o limite."));
          return;
        }
      }
    }

    if (edit.kind === "account") {
      const accounts = getAccounts();
      const duplicate = accounts.some((item, index) => index !== edit.index && item.name.toLowerCase() === name.toLowerCase());
      if (duplicate) return deps.notify("Ja existe uma conta com este nome.");
      const previous = accounts[edit.index]?.name;
      const account = accounts[edit.index];
      if (!account) return closeSettingsItemModal();
      account.name = name;
      state.transactions.forEach((item) => {
        if (item.account === previous) item.account = name;
      });
    }

    if (edit.kind === "card") {
      const cards = getCards();
      const duplicate = cards.some((item, index) => index !== edit.index && item.name.toLowerCase() === name.toLowerCase());
      if (duplicate) return deps.notify("Ja existe um cartao com este nome.");
      const card = cards[edit.index];
      if (!card) return closeSettingsItemModal();
      card.name = name;
      card.closingDay = Math.max(1, Math.min(31, dom.numberValue("#settings-item-modal-closing", 25) || 25));
      card.dueDay = Math.max(1, Math.min(31, dom.numberValue("#settings-item-modal-due", 10) || 10));
    }

    if (edit.kind === "tag") {
      const item = getTagRecord(edit.type, edit.categoryKey, edit.subKey);
      if (!item) return closeSettingsItemModal();
      const result = await getCatalogServices().updateCategoryTag.execute(item.id, {
        name,
        color: dom.value("#settings-item-modal-color"),
      });
      if (!result.ok) {
        deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar a etiqueta."));
        return;
      }
    }

    commitCatalogChanges("Alteracoes salvas.");
    closeSettingsItemModal();
  }

  async function addCategory(event) {
    event.preventDefault();
    const type = document.querySelector("#new-category-type").value;
    const name = document.querySelector("#new-category-name").value.trim();
    const color = document.querySelector("#new-category-color").value;
    const limit = Number(document.querySelector("#new-category-limit").value || 0);
    const key = slugify(name);

    if (!key) return deps.notify("Informe um nome valido.");
    const result = await getCatalogServices().createCategory.execute({
      kind: type,
      slug: key,
      name,
      color,
      monthlyLimit: type === "expense" ? limit : null,
    });
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel criar a categoria."));
      return;
    }
    if (type === "expense") {
      const budgetResult = await getBudgetServices().upsertCategoryBudget.execute({
        categorySlug: key,
        weeklyLimit: limit ? limit / 4 : 0,
        monthlyLimit: limit,
      });
      if (!budgetResult.ok) {
        deps.notify(firstErrorMessage(budgetResult.errors, "Nao foi possivel criar o limite."));
        return;
      }
    }
    event.currentTarget.reset();
    document.querySelector("#new-category-color").value = "#0b7285";
    commitCatalogChanges("Categoria criada.");
    deps.updateCategoryOptions();
  }

  function addAccount(event) {
    event.preventDefault();
    const input = document.querySelector("#new-account-name");
    const name = input.value.trim();
    if (!name) return deps.notify("Informe o nome da conta.");
    if (getAccounts().some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return deps.notify("Esta conta ja existe.");
    }

    getCatalog().accounts.push({
      id: `account:${slugify(name)}`,
      name,
      kind: "checking",
      color: "#0b7285",
      institution: "",
      isArchived: false,
    });
    input.value = "";
    commitCatalogChanges("Conta criada.");
    deps.updateAccountOptions();
  }

  function addCreditCard(event) {
    event.preventDefault();
    const nameInput = document.querySelector("#new-card-name");
    const name = nameInput.value.trim();
    const closingDay = Number(document.querySelector("#new-card-closing").value);
    const dueDay = Number(document.querySelector("#new-card-due").value);
    if (!name) return deps.notify("Informe o nome do cartao.");
    if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) return deps.notify("Informe dias validos.");
    if (getCards().some((card) => card.name.toLowerCase() === name.toLowerCase())) {
      return deps.notify("Este cartao ja existe.");
    }
    getCatalog().creditCards.push({ id: createId(), name, closingDay, dueDay, color: "#635bff", accountId: null, brand: "", isArchived: false });
    event.currentTarget.reset();
    document.querySelector("#new-card-closing").value = 25;
    document.querySelector("#new-card-due").value = 10;
    commitCatalogChanges("Cartao criado.");
    deps.updateCreditCardOptions();
  }

  function addSubcategory(event) {
    event.preventDefault();
    const type = document.querySelector("#new-subcategory-type").value;
    const categoryKey = document.querySelector("#new-subcategory-category").value;
    const name = document.querySelector("#new-subcategory-name").value.trim();
    const color = document.querySelector("#new-subcategory-color").value || getCategoryColorFromList(type, categoryKey, state.settings.categories);
    if (!name || !categoryKey) return deps.notify("Preencha a subcategoria corretamente.");

    const key = slugify(name);
    if (getTags(type, categoryKey).some((item) => item.slug === key)) {
      return deps.notify("Esta subcategoria ja existe nessa categoria.");
    }

    getCatalog().tags.push({
      id: `tag:${type}:${categoryKey}:${key}`,
      kind: type,
      categorySlug: categoryKey,
      slug: key,
      name,
      color,
      isArchived: false,
    });
    event.currentTarget.reset();
    document.querySelector("#new-subcategory-type").value = type;
    document.querySelector("#new-subcategory-color").value = "#0b7285";
    renderSubcategoryParentOptions();
    commitCatalogChanges("Subcategoria criada.");
  }

  async function addGoal(event) {
    event.preventDefault();
    const name = document.querySelector("#new-goal-name").value.trim();
    const key = document.querySelector("#new-goal-category").value;
    const target = Number(document.querySelector("#new-goal-target").value);
    if (!name || target <= 0) return deps.notify("Preencha a meta corretamente.");

    const result = await getGoalServices().createGoal.execute({ name, key, target, currentAmount: 0, color: "#635bff" });
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel criar a meta."));
      return;
    }

    event.currentTarget.reset();
    commitCatalogChanges("Meta criada.");
  }

  async function updateGoal(index) {
    const goal = getGoalRecord(index);
    if (!goal) return;
    const nameInput = document.querySelector(`[data-goal-name="${index}"]`);
    const categoryInput = document.querySelector(`[data-goal-category="${index}"]`);
    const targetInput = document.querySelector(`[data-goal-target="${index}"]`);
    if (!nameInput || !categoryInput || !targetInput) return;

    const name = nameInput.value.trim();
    const key = categoryInput.value;
    const target = Number(targetInput.value);
    if (!name || target <= 0) return deps.notify("Preencha a meta corretamente.");

    const result = await getGoalServices().updateGoal.execute(goal.id, { name, key, target });
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar a meta."));
      return;
    }

    commitCatalogChanges("Meta atualizada.");
  }

  async function removeCategory(type, key) {
    if (getCategoriesByType(type).length <= 1) {
      return deps.notify("Mantenha pelo menos uma categoria deste tipo.");
    }
    const inUse = state.transactions.some((item) => item.type === type && item.category === key);
    if (inUse) return deps.notify("Categoria em uso. Remova ou altere os lancamentos primeiro.");
    const category = getCategoryRecord(type, key);
    if (!category) return;
    const result = await getCatalogServices().archiveCategory.execute(category.id);
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel remover a categoria."));
      return;
    }
    const catalog = getCatalog();
    catalog.tags = catalog.tags.map((item) => item.kind === type && item.categorySlug === key ? { ...item, isArchived: true } : item);
    catalog.goals = catalog.goals.filter((goal) => goal.key !== key);
    catalog.budgets = catalog.budgets.filter((item) => item.categorySlug !== key);
    commitCatalogChanges("Categoria removida.");
    deps.updateCategoryOptions();
  }

  async function removeSubcategory(type, categoryKey, subKey) {
    const inUse = state.transactions.some((item) => item.type === type && item.category === categoryKey && item.subcategory === subKey);
    if (inUse) return deps.notify("Subcategoria em uso. Ajuste os lancamentos primeiro.");
    const tag = getTagRecord(type, categoryKey, subKey);
    if (!tag) return;
    const result = await getCatalogServices().archiveCategoryTag.execute(tag.id);
    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel remover a etiqueta."));
      return;
    }
    commitCatalogChanges("Subcategoria removida.");
  }

  function removeAccount(index) {
    const accounts = getAccounts();
    const name = accounts[index]?.name;
    if (!name) return;
    if (accounts.length <= 1) return deps.notify("Mantenha pelo menos uma conta cadastrada.");
    const inUse = state.transactions.some((item) => item.account === name);
    if (inUse) return deps.notify("Conta em uso. Remova ou altere os lancamentos primeiro.");
    getCatalog().accounts = getCatalog().accounts.filter((item, itemIndex) => itemIndex !== index);
    commitCatalogChanges("Conta removida.");
    deps.updateAccountOptions();
  }

  function removeCreditCard(index) {
    const card = getCardRecord(index);
    if (!card) return;
    const inUse = state.transactions.some((item) => item.creditCardId === card.id);
    if (inUse) return deps.notify("Cartao em uso. Altere os lancamentos primeiro.");
    getCatalog().creditCards = getCatalog().creditCards.filter((item) => item.id !== card.id);
    commitCatalogChanges("Cartao removido.");
    deps.updateCreditCardOptions();
  }

  async function editExpenseLimit(key) {
    const category = getCategoryRecord("expense", key);
    if (!category) return;
    const current = getBudgetRule(key);
    const next = prompt("Novo limite mensal para esta categoria:", current.monthly || category.monthlyLimit || 0);
    if (next === null) return;
    const monthly = Math.max(0, Number(next) || 0);
    const weekly = current.weekly || (monthly ? monthly / 4 : 0);
    const result = await getBudgetServices().upsertCategoryBudget.execute({
      categorySlug: key,
      weeklyLimit: weekly,
      monthlyLimit: monthly,
    });

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar o limite."));
      return;
    }

    category.monthlyLimit = monthly;
    commitCatalogChanges("Limite atualizado.");
  }

  async function saveBudgetRule(event) {
    event.preventDefault();
    const form = event.target.closest(".budget-rule-form");
    const key = form.dataset.budgetKey;
    if (!key) return;
    const weekly = Math.max(0, Number(new FormData(form).get("weekly")) || 0);
    const monthly = Math.max(0, Number(new FormData(form).get("monthly")) || 0);
    const result = await getBudgetServices().upsertCategoryBudget.execute({
      categorySlug: key,
      weeklyLimit: weekly,
      monthlyLimit: monthly,
    });

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel salvar a regra."));
      return;
    }

    const category = getCategoryRecord("expense", key);
    if (category) category.monthlyLimit = monthly;
    commitCatalogChanges("Regras de gasto atualizadas.");
  }

  return {
    getCategoryRecord,
    getAccountRecord,
    getCardRecord,
    getTagRecord,
    renderGoals,
    renderGoalsSummary,
    openGoalContribution,
    editGoalFromCard,
    closeGoalModal,
    saveGoalFromModal,
    renderSettings,
    renderManagePanels,
    renderCategoryManager,
    renderAccountManager,
    renderCardManager,
    renderGoalManager,
    renderGoalCategoryOptions,
    renderSubcategoryParentOptions,
    renderSubcategoryManager,
    addInlineSubcategory,
    openSettingsItemModal,
    closeSettingsItemModal,
    saveSettingsItemFromModal,
    addCategory,
    addAccount,
    addCreditCard,
    addSubcategory,
    addGoal,
    updateGoal,
    async removeGoal(index) {
      const goal = getGoalRecord(index);
      if (!goal) return;
      const result = await getGoalServices().archiveGoal.execute(goal.id);
      if (!result.ok) {
        deps.notify(firstErrorMessage(result.errors, "Nao foi possivel remover a meta."));
        return;
      }
      commitCatalogChanges("Meta removida.");
    },
    removeCategory,
    removeSubcategory,
    removeAccount,
    removeCreditCard,
    editExpenseLimit,
    saveBudgetRule,
  };
}
