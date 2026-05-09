import { els, state } from "../core/state.js";
import {
  categoryDisplayLabel,
  createId,
  esc,
  getMonthTransactions,
  getSubcategories,
  money,
  parseLocalDate,
  slugify,
  simplifyFieldName,
  toDateInput,
} from "../core/utils.js";
import { isFeatureEnabled } from "../core/featureFlags.js";
import { buildMonthTransactionList } from "../application/transactions/buildMonthTransactionList.js";
import { buildTransactionSeries } from "../application/transactions/buildTransactionSeries.js";
import { firstErrorMessage } from "../application/shared/result.js";
import { createTransactionServices } from "../infrastructure/composition/createTransactionServices.js";
import { runTransactionCreationShadow } from "../infrastructure/shadow/runTransactionCreationShadow.js";
import { renderTransactionTableHtml } from "./tableTemplate.js";
import { createTransactionsDom } from "./transactionsDom.js";
import { getTypeExperience } from "./typeExperience.js";

export function createTransactionsModule(deps) {
  let transactionServices = null;
  let shadowServices = null;
  let shadowTransactions = [];
  const dom = createTransactionsDom();

  function getTransactionServices() {
    if (transactionServices) return transactionServices;
    transactionServices = createTransactionServices({
      readTransactions: () => state.transactions,
      writeTransactions: (nextTransactions) => {
        state.transactions = nextTransactions;
      },
      createId,
    });
    return transactionServices;
  }

  function getShadowServices() {
    if (shadowServices) return shadowServices;
    shadowServices = createTransactionServices({
      readTransactions: () => shadowTransactions,
      writeTransactions: (nextTransactions) => {
        shadowTransactions = nextTransactions;
      },
      createId,
    });
    return shadowServices;
  }

  function toShadowDraft(transaction) {
    const draft = {
      userId: state.currentUser?.id || "",
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      account: transaction.account,
      amount: transaction.amount,
      date: transaction.date,
      status: transaction.status || "paid",
      createdAt: transaction.createdAt,
    };

    if (transaction.type === "expense") {
      draft.subcategory = transaction.subcategory || "";
      draft.paymentMethod = transaction.paymentMethod || "pix";
      draft.dueDate = transaction.dueDate || transaction.date;
      draft.recurrence = transaction.recurrence || "none";
      draft.repeatCount = 1;
    }

    return draft;
  }

  async function compareTransactionsInShadow(transactions) {
    const services = getShadowServices();
    await runTransactionCreationShadow({
      enabled: isFeatureEnabled("transactionShadow"),
      transactions,
      toDraft: toShadowDraft,
      createTransaction: services.createTransaction,
    });
  }

  function shouldUseExpenseOnlyFields(type) {
    return type === "expense";
  }

  function defaultPaymentMethodForType(type) {
    return type === "expense" ? "pix" : "transfer";
  }

  function firstAccountName() {
    return state.settings.accounts[0] || "Conta corrente";
  }

  function resolveAccountValue(value, fallback = firstAccountName()) {
    const account = String(value || "").trim();
    return account || fallback;
  }

  function buildTransactionDraftFromValues({
    type,
    description,
    category,
    subcategory,
    account,
    amount,
    date,
    dueDate,
    status,
    paymentMethod,
    creditCardId,
    recurrence,
    recurrenceId,
    installmentGroup,
    installmentNumber,
    installmentTotal,
  }) {
    const useExpenseFields = shouldUseExpenseOnlyFields(type);
    const normalizedPaymentMethod = useExpenseFields ? paymentMethod || "pix" : defaultPaymentMethodForType(type);
    const isCredit = useExpenseFields && normalizedPaymentMethod === "credit";
    const draft = {
      userId: state.currentUser?.id || "",
      type,
      description: String(description || "").trim(),
      category,
      account: resolveAccountValue(account),
      amount: Number(amount),
      date,
      status: status || "paid",
    };

    if (useExpenseFields) {
      draft.subcategory = subcategory || "";
      draft.paymentMethod = normalizedPaymentMethod;
      draft.dueDate = dueDate || date;
      draft.recurrence = recurrence || "none";
      draft.recurrenceId = recurrenceId || null;
      draft.creditCardId = isCredit ? creditCardId || null : null;
      draft.installmentGroup = isCredit ? installmentGroup || null : null;
      draft.installmentNumber = isCredit ? installmentNumber || null : null;
      draft.installmentTotal = isCredit ? installmentTotal || null : null;
      draft.repeatCount = 1;
    }

    return draft;
  }

  function syncTransactionTypeFields() {
    const isExpense = shouldUseExpenseOnlyFields(state.activeType);
    const experience = getTypeExperience(state.activeType);

    updateSubcategoryOptions();
    dom.syncTransactionTypeFields({
      isExpense,
      experience,
      defaultPaymentMethod: defaultPaymentMethodForType(state.activeType),
    });

    updateCreditPaymentFields();
  }

  function syncTransactionModalTypeFields() {
    const isExpense = shouldUseExpenseOnlyFields(state.transactionModalType);
    const experience = getTypeExperience(state.transactionModalType);

    updateTransactionModalSubcategoryOptions();
    dom.syncTransactionModalTypeFields({
      isExpense,
      experience,
      defaultPaymentMethod: defaultPaymentMethodForType(state.transactionModalType),
    });

    updateTransactionModalCreditFields();
  }

  function setDefaultDate() {
    const today = new Date();
    const value = toDateInput(today);
    els.date.value = value;
    dom.setDefaultDueDate(value);
  }

  function updateCategoryOptions() {
    els.category.innerHTML = state.settings.categories[state.activeType]
      .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
      .join("");
    updateSubcategoryOptions();
  }

  function updateAccountOptions() {
    const previousValue = els.account.value;
    els.account.innerHTML = state.settings.accounts
      .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
      .join("");
    els.account.value = state.settings.accounts.includes(previousValue) ? previousValue : firstAccountName();
  }

  function updateCreditCardOptions() {
    const optionsHtml = '<option value="">Nenhum</option>' + state.settings.creditCards
      .map((card) => `<option value="${esc(card.id)}">${esc(card.name)}</option>`)
      .join("");
    dom.syncCreditCardOptions(optionsHtml);
  }

  function updateCreditPaymentFields() {
    const isExpense = shouldUseExpenseOnlyFields(state.activeType);
    dom.syncCreditPaymentFields({
      isExpense,
      isCredit: isExpense && dom.readPaymentMethod() === "credit",
    });
  }

  function updateTransactionModalCategories(type = state.transactionModalType) {
    const category = document.querySelector("#transaction-modal-category");
    if (!category) return;
    category.innerHTML = state.settings.categories[type]
      .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
      .join("");
    updateTransactionModalSubcategoryOptions();
  }

  function updateTransactionModalAccounts() {
    const account = document.querySelector("#transaction-modal-account");
    if (!account) return;
    const previousValue = account.value;
    account.innerHTML = state.settings.accounts
      .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
      .join("");
    account.value = state.settings.accounts.includes(previousValue) ? previousValue : firstAccountName();
  }

  function updateTransactionModalCreditFields() {
    const isExpense = shouldUseExpenseOnlyFields(state.transactionModalType);
    dom.syncTransactionModalCreditFields({
      isExpense,
      isCredit: isExpense && dom.readTransactionModalPaymentMethod() === "credit",
    });
  }

  function updateSubcategoryOptions(preferredValue = "") {
    const field = document.querySelector("#subcategory-field");
    const select = document.querySelector("#subcategory");
    if (!field || !select) return;
    if (!shouldUseExpenseOnlyFields(state.activeType)) {
      field.classList.add("is-hidden");
      field.hidden = true;
      select.innerHTML = "";
      select.value = "";
      return;
    }
    const categoryKey = els.category.value;
    const items = getSubcategories(state.activeType, categoryKey);
    if (!items.length) {
      field.classList.add("is-hidden");
      field.hidden = true;
      select.innerHTML = "";
      select.value = "";
      return;
    }
    field.classList.remove("is-hidden");
    field.hidden = false;
    select.innerHTML = `<option value="">Sem subcategoria</option>${items
      .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
      .join("")}`;
    select.value = items.some(([value]) => value === preferredValue) ? preferredValue : "";
  }

  function updateTransactionModalSubcategoryOptions(preferredValue = "") {
    const field = document.querySelector("#transaction-modal-subcategory-field");
    const select = document.querySelector("#transaction-modal-subcategory");
    const categoryKey = document.querySelector("#transaction-modal-category")?.value;
    if (!field || !select || !categoryKey) return;
    if (!shouldUseExpenseOnlyFields(state.transactionModalType)) {
      field.classList.add("is-hidden");
      field.hidden = true;
      select.innerHTML = "";
      select.value = "";
      return;
    }
    const items = getSubcategories(state.transactionModalType, categoryKey);
    if (!items.length) {
      field.classList.add("is-hidden");
      field.hidden = true;
      select.innerHTML = "";
      select.value = "";
      return;
    }
    field.classList.remove("is-hidden");
    field.hidden = false;
    select.innerHTML = `<option value="">Sem subcategoria</option>${items
      .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`)
      .join("")}`;
    select.value = items.some(([value]) => value === preferredValue) ? preferredValue : "";
  }

  function setTransactionModalType(type) {
    state.transactionModalType = type;
    document.querySelectorAll(".transaction-modal-segment").forEach((button) => {
      button.classList.toggle("active", button.dataset.modalType === type);
    });
    updateTransactionModalCategories(type);
    syncTransactionModalTypeFields();
  }

  function setActiveType(type) {
    state.activeType = type;
    document.querySelectorAll(".segment").forEach((button) => {
      button.classList.toggle("active", button.dataset.type === type);
    });
    updateCategoryOptions();
    syncTransactionTypeFields();
  }

  function renderTable() {
    const filtered = buildMonthTransactionList({
      transactions: state.transactions,
      monthKey: deps.monthKey(state.currentDate),
      typeFilter: state.typeFilter,
      search: state.search,
    });

    els.table.innerHTML = renderTransactionTableHtml(filtered, {
      escapeHtml: esc,
      formatCategoryLabel: categoryDisplayLabel,
      formatDate: (value) => parseLocalDate(value).toLocaleDateString("pt-BR"),
      formatMoney: money,
    });
  }

  async function addTransaction(event) {
    event.preventDefault();
    const values = dom.readTransactionForm(event.currentTarget);
    if (state.editingId) {
      updateTransaction(values);
      return;
    }
    const transactions = buildTransactionSeries({
      type: state.activeType,
      createId,
      resolveAccount: resolveAccountValue,
      values,
    });
    const totalItems = transactions.length;

    const drafts = transactions.map((transaction) => ({
      ...transaction,
      userId: state.currentUser?.id || "local-user",
    }));
    await compareTransactionsInShadow(drafts);
    const result = await getTransactionServices().createTransactionSeries.execute(drafts);

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel salvar o lancamento."));
      return;
    }

    deps.persist();
    dom.resetTransactionForm(event.currentTarget);
    setDefaultDate();
    updateCategoryOptions();
    deps.renderAll();
    deps.notify(totalItems > 1 ? `${totalItems} lancamentos criados.` : "Lancamento salvo.");
  }

  async function updateTransaction(values) {
    const item = state.transactions.find((transaction) => transaction.id === state.editingId);
    if (!item) return;

    const draft = buildTransactionDraftFromValues({
      type: state.activeType,
      ...values,
      recurrence: item.recurrence,
      recurrenceId: item.recurrenceId,
      installmentGroup: item.installmentGroup,
      installmentNumber: item.installmentNumber,
      installmentTotal: item.installmentTotal,
    });
    const result = await getTransactionServices().updateTransaction.execute(item.id, draft);

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel atualizar o lancamento."));
      return;
    }

    deps.persist();
    resetTransactionForm();
    deps.renderAll();
    deps.notify("Lancamento atualizado.");
  }

  function editTransaction(id) {
    const item = state.transactions.find((transaction) => transaction.id === id);
    if (!item) return;
    state.activeTransactionEditId = id;
    setTransactionModalType(item.type);
    updateTransactionModalAccounts();
    updateCreditCardOptions();
    dom.fillTransactionModal(item);
    updateTransactionModalSubcategoryOptions(item.subcategory || "");
    syncTransactionModalTypeFields();
    dom.setValue("#transaction-modal-credit-card", item.creditCardId || "");
    dom.openTransactionModal();
  }

  function resetTransactionForm() {
    state.editingId = null;
    dom.resetTransactionForm(els.form);
    setDefaultDate();
    updateCategoryOptions();
    updateAccountOptions();
    updateCreditCardOptions();
    dom.enableTransactionSeriesControls();
    dom.hideCancelEdit();
    syncTransactionTypeFields();
  }

  function closeTransactionModal() {
    state.activeTransactionEditId = null;
    dom.closeTransactionModal();
  }

  async function saveTransactionFromModal(event) {
    event.preventDefault();
    const item = state.transactions.find((transaction) => transaction.id === state.activeTransactionEditId);
    if (!item) return closeTransactionModal();

    const form = dom.readTransactionModalForm();
    const draft = buildTransactionDraftFromValues({
      type: state.transactionModalType,
      ...form,
      recurrence: item.recurrence,
      recurrenceId: item.recurrenceId,
      installmentGroup: item.installmentGroup,
      installmentNumber: item.installmentNumber,
      installmentTotal: item.installmentTotal,
    });
    const result = await getTransactionServices().updateTransaction.execute(item.id, draft);

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Preencha os dados do lancamento corretamente."));
      return;
    }

    deps.persist();
    deps.renderAll();
    closeTransactionModal();
    deps.notify("Lancamento atualizado.");
  }

  function markTransactionPaid(id) {
    const item = state.transactions.find((transaction) => transaction.id === id);
    if (!item) return;
    item.status = "paid";
    item.date = toDateInput(new Date());
    deps.persist();
    deps.renderAll();
    deps.notify("Lancamento marcado como pago.");
  }

  async function removeTransaction(id) {
    const result = await getTransactionServices().deleteTransaction.execute(id, {
      userId: state.currentUser?.id || "",
    });

    if (!result.ok) {
      deps.notify(firstErrorMessage(result.errors, "Nao foi possivel remover o lancamento."));
      return;
    }

    deps.persist();
    deps.renderAll();
    deps.notify("Lancamento removido.");
  }

  function getImportedField(row, kind) {
    const matchers = {
      description: (key) => key === "description" || key === "descricao" || key.startsWith("descri"),
      category: (key) => key === "category" || key === "cat" || key.includes("categoria"),
      note: (key) => key === "note" || key.includes("observa"),
      payment: (key) => key === "paymentmethod" || key === "payment" || key.includes("pagamento"),
      amount: (key) => key === "amount" || key === "val" || key.includes("valor"),
      date: (key) => key === "date" || key === "data",
      type: (key) => key === "type" || key === "tipo",
    };
    const matcher = matchers[kind];
    const found = Object.entries(row).find(([key]) => matcher(simplifyFieldName(key)));
    return found ? found[1] : undefined;
  }

  function normalizePaymentMethod(value) {
    const key = slugify(String(value || "pix"));
    if (key.includes("credito") || key.includes("credit")) return "credit";
    if (key.includes("debito") || key.includes("debit")) return "debit";
    if (key.includes("dinheiro") || key.includes("cash")) return "cash";
    if (key.includes("transfer")) return "transfer";
    return "pix";
  }

  function normalizeImportedDate(value) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    if (typeof value === "string" && value.includes("/")) {
      const [day, month, year] = value.split("/");
      if (day && month && year) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return "";
  }

  function ensureImportedCategory(settings, type, label) {
    const name = String(label || "Outros").trim() || "Outros";
    const key = slugify(name) || "outros";
    const categories = settings.categories[type] || settings.categories.expense;
    if (!categories.some(([itemKey]) => itemKey === key)) {
      categories.push([key, name, "#667085", type === "expense" ? 0 : undefined]);
    }
    return key;
  }

  function normalizeImportedTransaction(row, settings) {
    const description = String(getImportedField(row, "description") || getImportedField(row, "note") || "").trim();
    const amount = Number(getImportedField(row, "amount"));
    const date = normalizeImportedDate(getImportedField(row, "date"));
    if (!description || !Number.isFinite(amount) || amount <= 0 || !date) return null;

    const rawType = slugify(String(getImportedField(row, "type") || ""));
    const type = rawType.includes("receita") || rawType.includes("income")
      ? "income"
      : rawType.includes("invest")
        ? "investment"
        : "expense";
    const category = ensureImportedCategory(settings, type, getImportedField(row, "category"));
    const subcategory = row.subcategory || row.subcat || null;
    const paymentMethod = normalizePaymentMethod(getImportedField(row, "payment"));
    const isCredit = paymentMethod === "credit";

    return {
      id: row.id || createId(),
      type,
      description,
      category,
      subcategory,
      account: row.account || "Conta corrente",
      amount,
      date,
      dueDate: normalizeImportedDate(row.dueDate || row.due_date) || date,
      status: row.status || "paid",
      paymentMethod,
      creditCardId: isCredit ? row.creditCardId || row.credit_card_id || null : null,
      recurrence: row.recurrence || "none",
      recurrenceId: row.recurrenceId || row.recurrence_id || null,
      installmentGroup: isCredit ? row.installmentGroup || row.installment_group || null : null,
      installmentNumber: isCredit ? row.installmentNumber || row.installment_number || null : null,
      installmentTotal: isCredit ? row.installmentTotal || row.installment_total || null : null,
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    };
  }

  function normalizeImportedBackup(imported) {
    const rows = Array.isArray(imported) ? imported : imported.transactions;
    if (!Array.isArray(rows)) throw new Error("Formato invalido");
    const settings = imported.settings ? deps.mergeSettings(deps.clone(imported.settings)) : deps.mergeSettings(deps.clone(state.settings));
    const transactions = rows.map((row) => normalizeImportedTransaction(row, settings)).filter(Boolean);
    if (!transactions.length) throw new Error("Nenhum lancamento valido");
    return {
      transactions,
      settings,
      catalog: imported.catalog || null,
      ignored: rows.length - transactions.length,
      total: rows.length,
    };
  }

  function showImportPreview(imported) {
    state.pendingImport = imported;
    const target = document.querySelector("#import-preview");
    const currentCount = state.transactions.length;
    target.innerHTML = `
      <div>
        <strong>Previa da importacao</strong>
        <p>${imported.transactions.length} lancamentos validos encontrados.${imported.ignored ? ` ${imported.ignored} linha${imported.ignored === 1 ? "" : "s"} ignorada${imported.ignored === 1 ? "" : "s"} por falta de data, descricao ou valor.` : ""}</p>
        <p>Hoje existem ${currentCount} lancamento${currentCount === 1 ? "" : "s"} no app.</p>
      </div>
      <div class="import-preview-actions">
        <button class="primary-btn" type="button" data-import-action="merge">Somar aos dados atuais</button>
        <button class="ghost-btn" type="button" data-import-action="replace">Substituir tudo</button>
        <button class="danger-btn" type="button" data-import-action="cancel">Cancelar</button>
      </div>
    `;
    target.classList.remove("is-hidden");
  }

  function clearImportPreview() {
    state.pendingImport = null;
    const target = document.querySelector("#import-preview");
    target.innerHTML = "";
    target.classList.add("is-hidden");
  }

  function applyPendingImport(mode) {
    if (!state.pendingImport) return;
    const imported = state.pendingImport;
    if (mode === "replace") {
      state.transactions = imported.transactions;
      state.settings = imported.settings;
      state.catalog = imported.catalog || deps.hydrateCatalog(state.settings, state.catalog);
      deps.syncSettingsFromCatalog();
    } else {
      const byId = new Map(state.transactions.map((item) => [item.id, item]));
      imported.transactions.forEach((item) => byId.set(item.id, item));
      state.transactions = Array.from(byId.values());
      state.settings = deps.mergeSettings(imported.settings);
      state.catalog = imported.catalog ? deps.hydrateCatalog(imported.settings, imported.catalog) : deps.hydrateCatalog(state.settings, state.catalog);
      deps.syncSettingsFromCatalog();
    }
    deps.persist();
    updateCategoryOptions();
    updateAccountOptions();
    updateCreditCardOptions();
    deps.renderAll();
    clearImportPreview();
    deps.notify(mode === "replace" ? "Backup importado substituindo os dados." : "Backup somado aos dados atuais.");
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportCsv() {
    const rows = [["Data", "Vencimento", "Descricao", "Categoria", "Subcategoria", "Conta", "Status", "Pagamento", "Tipo", "Valor"]];
    getMonthTransactions().forEach((item) => {
      const [, categoryLabel] = deps.getCategory(item.type, item.category);
      const subcategoryLabel = deps.getSubcategoryLabel(item.type, item.category, item.subcategory);
      rows.push([
        item.date,
        item.dueDate || item.date,
        item.description,
        categoryLabel,
        subcategoryLabel,
        item.account,
        item.status || "paid",
        item.paymentMethod || "pix",
        item.type,
        String(item.amount).replace(".", ","),
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    download(`finance-flow-${deps.monthKey(state.currentDate)}.csv`, `\ufeff${csv}`, "text/csv;charset=utf-8");
  }

  function exportJson() {
    download(
      "finance-flow-backup.json",
      JSON.stringify({ transactions: state.transactions, settings: state.settings, catalog: state.catalog }, null, 2),
      "application/json"
    );
  }

  function seedData() {
    if (state.transactions.length && !confirm("Substituir os dados atuais por dados de exemplo?")) return;
    const current = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 10);
    const samples = [
      ["income", "Salario", "salario", "Conta corrente", 7200, 5],
      ["expense", "Aluguel", "moradia", "Conta corrente", 1850, 6],
      ["expense", "Supermercado", "alimentacao", "Cartao de credito", 760, 8],
      ["expense", "Uber e metro", "transporte", "Cartao de credito", 210, 12],
      ["investment", "Tesouro Selic", "renda-fixa", "Corretora", 900, 15],
      ["expense", "Academia e farmacia", "saude", "Cartao de credito", 260, 18],
      ["expense", "Cinema e jantar", "lazer", "Cartao de credito", 340, 21],
      ["income", "Projeto freelance", "freelance", "Conta corrente", 1300, 24],
    ];

    state.transactions = samples.map(([type, description, category, account, amount, day]) => ({
      id: createId(),
      type,
      description,
      category,
      subcategory: description === "Supermercado" ? "mercado" : description === "Uber e metro" ? "app-mobilidade" : type === "income" && category === "salario" ? "fixo" : type === "investment" && category === "renda-fixa" ? "tesouro" : null,
      account,
      amount,
      date: new Date(current.getFullYear(), current.getMonth(), day).toISOString().slice(0, 10),
      dueDate: new Date(current.getFullYear(), current.getMonth(), day).toISOString().slice(0, 10),
      status: day > new Date().getDate() ? "pending" : "paid",
      paymentMethod: type === "income" ? "transfer" : "credit",
      creditCardId: type === "expense" ? "default-card" : null,
      recurrence: "none",
      recurrenceId: null,
      installmentGroup: null,
      installmentNumber: null,
      installmentTotal: null,
      createdAt: new Date().toISOString(),
    }));
    deps.persist();
    deps.renderAll();
    deps.notify("Dados de exemplo carregados.");
  }

  return {
    setDefaultDate,
    updateCategoryOptions,
    updateAccountOptions,
    updateCreditCardOptions,
    updateCreditPaymentFields,
    updateTransactionModalCategories,
    updateTransactionModalAccounts,
    updateTransactionModalCreditFields,
    updateSubcategoryOptions,
    updateTransactionModalSubcategoryOptions,
    setTransactionModalType,
    setActiveType,
    renderTable,
    addTransaction,
    updateTransaction,
    editTransaction,
    resetTransactionForm,
    closeTransactionModal,
    saveTransactionFromModal,
    markTransactionPaid,
    removeTransaction,
    getImportedField,
    normalizePaymentMethod,
    normalizeImportedDate,
    ensureImportedCategory,
    normalizeImportedTransaction,
    normalizeImportedBackup,
    showImportPreview,
    clearImportPreview,
    applyPendingImport,
    download,
    exportCsv,
    exportJson,
    seedData,
  };
}
