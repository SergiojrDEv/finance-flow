const typeLabels = { expense: "Despesa", income: "Receita", investment: "Investimento" };
const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return formatter.format(value || 0);
}

function safeCssColor(value, fallback = "#667085") {
  const color = String(value || "").trim();
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return color;
  if (/^var\(--[a-z0-9-]+\)$/i.test(color)) return color;
  return fallback;
}

export function renderCategoryManagerHtml(rows) {
  return rows
    .map((item) => `
        <div class="manage-item">
          <div>
            <strong><span class="color-dot" style="--color:${safeCssColor(item.color)}"></span>${esc(item.label)}</strong>
            <small>${typeLabels[item.type]}${item.type === "expense" ? ` | limite ${money(Number(item.limit || 0))}` : ""}${item.tagCount ? ` | ${item.tagCount} subcategoria${item.tagCount === 1 ? "" : "s"}` : ""}</small>
          </div>
          <div class="mini-actions">
            <button class="mini-btn" type="button" data-edit-category="${item.type}:${item.key}">Editar</button>
            <button class="mini-btn danger" type="button" data-remove-category="${item.type}:${item.key}">Remover</button>
          </div>
        </div>
      `)
    .join("");
}

export function renderAccountManagerHtml(accounts) {
  return accounts
    .map((account, index) => `
        <div class="manage-item">
          <div>
            <strong>${esc(account.name)}</strong>
            <small>Conta disponivel para lancamentos</small>
          </div>
          <div class="mini-actions">
            <button class="mini-btn" type="button" data-edit-account="${index}">Editar</button>
            <button class="mini-btn danger" type="button" data-remove-account="${index}">Remover</button>
          </div>
        </div>
      `)
    .join("");
}

export function renderCardManagerHtml(cards) {
  return cards
    .map((card, index) => `
        <div class="manage-item">
          <div>
            <strong>${esc(card.name)}</strong>
            <small>Fecha dia ${card.closingDay} | vence dia ${card.dueDay}</small>
          </div>
          <div class="mini-actions">
            <button class="mini-btn" type="button" data-edit-card="${index}">Editar</button>
            <button class="mini-btn danger" type="button" data-remove-card="${index}">Remover</button>
          </div>
        </div>
      `)
    .join("");
}

export function renderGoalManagerHtml(goals, categoryOptions) {
  if (!goals.length) return '<div class="empty-state">Nenhuma meta cadastrada.</div>';

  return goals
    .map((goal, index) => `
          <div class="manage-item goal-edit-item">
            <div>
              <strong>${esc(goal.name)}</strong>
              <small>${esc(goal.categoryLabel)} | alvo ${money(Number(goal.target))}</small>
            </div>
            <div class="goal-edit-grid">
              <label>
                Nome
                <input data-goal-name="${index}" type="text" value="${esc(goal.name)}">
              </label>
              <label>
                Categoria
                <select data-goal-category="${index}">${categoryOptions(goal.key)}</select>
              </label>
              <label>
                Valor alvo
                <input data-goal-target="${index}" type="number" min="1" step="0.01" value="${Number(goal.target) || 0}">
              </label>
            </div>
            <div class="mini-actions">
              <button class="mini-btn" type="button" data-save-goal="${index}">Salvar</button>
              <button class="mini-btn danger" type="button" data-remove-goal="${index}">Remover</button>
            </div>
          </div>
        `)
    .join("");
}

export function renderSubcategoryManagerHtml(groups) {
  return groups.map((group) => `
      <article class="tag-plan-card">
        <header class="tag-plan-header">
          <div>
            <strong>${esc(group.categoryLabel)}</strong>
            <small>${typeLabels[group.type]}${group.tags.length ? ` | ${group.tags.length} etiqueta${group.tags.length === 1 ? "" : "s"}` : " | sem etiquetas"}</small>
          </div>
        </header>
        <div class="tag-chip-wrap">
          ${group.tags.length ? group.tags.map(([subKey, subLabel, subColor]) => `
            <div class="tag-chip" style="--tag-color:${safeCssColor(subColor || group.fallbackColor)}">
              <span class="tag-chip-dot"></span>
              <span>${esc(subLabel)}</span>
              <span class="tag-chip-actions">
                <button class="tag-chip-action" type="button" data-edit-subcategory="${group.type}:${group.categoryKey}:${subKey}" title="Editar etiqueta">Editar</button>
                <button class="tag-chip-action danger" type="button" data-remove-subcategory="${group.type}:${group.categoryKey}:${subKey}" title="Remover etiqueta">x</button>
              </span>
            </div>
          `).join("") : '<span class="tag-chip tag-chip-empty">Nenhuma etiqueta ainda</span>'}
        </div>
        <form class="tag-inline-form" data-subcategory-inline="${group.type}:${group.categoryKey}">
          <input type="text" name="name" placeholder="Adicionar etiqueta" aria-label="Adicionar etiqueta em ${esc(group.categoryLabel)}">
          <button class="mini-btn" type="submit">Adicionar</button>
        </form>
      </article>
    `).join("");
}
