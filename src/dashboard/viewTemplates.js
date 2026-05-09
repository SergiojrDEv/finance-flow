import {
  categoryDisplayLabel,
  esc,
  money,
  parseLocalDate,
  paymentMethodLabel,
  safeCssColor,
} from "../core/utils.js";

export function formatInsightText(item) {
  if (item.kind === "due") return `${item.description}: ${money(item.amount)}`;
  if (item.kind === "budget") return `${item.description}: ${money(item.amount)} de ${money(item.threshold)}`;
  if (item.kind === "investment") return `Voce investiu ${item.investmentRate.toFixed(1)}% da renda.`;
  return item.description || "";
}

export function renderEmptyState(title, copy) {
  return `
      <div class="empty-state app-empty-state">
        <strong class="empty-state-title">${esc(title)}</strong>
        <span class="empty-state-copy">${esc(copy)}</span>
      </div>
    `;
}

export function renderInsightsHtml(insights) {
  if (!insights.length) {
    return renderEmptyState("Tudo certo por enquanto", "Quando houver vencimentos ou limites perto do estouro, eles aparecem aqui.");
  }

  return insights.slice(0, 5).map((item) => `
      <div class="insight-item">
        <span>${esc(item.label)}</span>
        <strong>${esc(formatInsightText(item))}</strong>
      </div>
    `).join("");
}

export function renderCategoryBreakdownHtml(rows) {
  if (!rows.length) {
    return renderEmptyState("Sem despesas no mes", "Cadastre uma despesa para entender quais categorias pesam mais no seu dinheiro.");
  }

  return rows
    .map((item) => `
          <div class="category-row">
            <strong>${esc(item.label)}</strong>
            <span class="money negative">${money(item.value)}</span>
            <div class="bar"><span style="--value:${item.width}%;--color:${safeCssColor(item.color)}"></span></div>
          </div>
        `)
    .join("");
}

export function renderTransactionHighlightsHtml(highlights) {
  const balanceClass = highlights.totals.balance >= 0 ? "positive" : "negative";
  const balanceLabel = highlights.totals.balance >= 0 ? "Sobra do mes" : "Falta no mes";

  return `
      <article class="mini-stat-card movement">
        <span>Movimento do mes</span>
        <strong>${highlights.count} lancamentos</strong>
        <small>Entradas: ${money(highlights.totals.income)}</small>
        <small>Saidas: ${money(highlights.totals.outflow)}</small>
      </article>
      <article class="mini-stat-card balance">
        <span>${balanceLabel}</span>
        <strong class="money ${balanceClass}">${money(Math.abs(highlights.totals.balance))}</strong>
        <small>${highlights.status.pending} pendentes ou previstos</small>
      </article>
      <article class="mini-stat-card payment">
        <span>Forma mais usada</span>
        <strong>${highlights.payments.pix} no Pix</strong>
        <small>${highlights.payments.credit} no credito</small>
      </article>
    `;
}

export function renderBudgetOverviewHtml(rows) {
  if (!rows.length) {
    return renderEmptyState("Nenhuma categoria para acompanhar", "Crie categorias de despesa em Ajustes para definir limites semanais e mensais.");
  }

  return rows
    .map((item) => `
          <article class="budget-card">
            <header class="budget-card-header">
              <strong>${esc(item.label)}</strong>
              <div class="budget-badges">
                <span class="budget-badge">Sem ${item.status.weekly}</span>
                <span class="budget-badge">Mes ${item.status.monthly}</span>
              </div>
            </header>
            <div class="budget-meter">
              <div class="budget-meter-head">
                <span>Semana</span>
                <small>${money(item.used.weekly)} de ${money(item.rule.weekly)}</small>
              </div>
              <div class="bar"><span style="--value:${item.pct.weekly}%;--color:${safeCssColor(item.color)}"></span></div>
            </div>
            <div class="budget-meter">
              <div class="budget-meter-head">
                <span>Mes</span>
                <small>${money(item.used.monthly)} de ${money(item.rule.monthly)}</small>
              </div>
              <div class="bar"><span style="--value:${item.pct.monthly}%;--color:${safeCssColor(item.color)}"></span></div>
            </div>
            <form class="budget-rule-form compact" data-budget-key="${esc(item.key)}">
              <label>
                Semanal
                <input type="number" min="0" step="0.01" name="weekly" value="${Number(item.rule.weekly || 0)}">
              </label>
              <label>
                Mensal
                <input type="number" min="0" step="0.01" name="monthly" value="${Number(item.rule.monthly || 0)}">
              </label>
              <button class="mini-btn" type="submit">Salvar regra</button>
            </form>
          </article>
        `)
    .join("");
}

export function renderDailyHistoryHtml(history) {
  if (!history.length) {
    return renderEmptyState("Seu historico ainda esta vazio", "Depois que voce cadastrar receitas, despesas ou investimentos, a rotina diaria aparece aqui.");
  }

  return history
    .map((day) => `
          <article class="history-day-card">
            <header class="history-day-header">
              <div>
                <strong>${parseLocalDate(day.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</strong>
                <small>${day.count} lancamento${day.count === 1 ? "" : "s"}</small>
              </div>
              <div class="history-day-totals">
                <small>Entradas: <span class="money positive">${money(day.totals.income)}</span></small>
                <small>Saidas: <span class="money negative">${money(day.totals.outflow)}</span></small>
              </div>
            </header>
            <div class="history-day-items">
              ${day.items.map((item) => `
                <div class="history-row">
                  <div>
                    <strong>${esc(item.description)}</strong>
                    <small>${esc(categoryDisplayLabel(item))} | ${esc(paymentMethodLabel(item.paymentMethod))}</small>
                  </div>
                  <strong class="money ${item.type === "income" ? "positive" : "negative"}">${item.type === "income" ? "+" : "-"} ${money(Number(item.amount || 0))}</strong>
                </div>
              `).join("")}
            </div>
          </article>
        `)
    .join("");
}
