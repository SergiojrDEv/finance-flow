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

export function renderEmptyState(title, copy, actions = []) {
  return `
      <div class="empty-state app-empty-state">
        <strong class="empty-state-title">${esc(title)}</strong>
        <span class="empty-state-copy">${esc(copy)}</span>
        ${actions.length ? `
          <div class="empty-state-actions">
            ${actions.map((item) => `<a href="${esc(item.href)}">${esc(item.label)}</a>`).join("")}
          </div>
        ` : ""}
      </div>
    `;
}

export function renderInsightsHtml(insights) {
  if (!insights.length) {
    return renderEmptyState(
      "Tudo certo por enquanto",
      "Quando houver vencimentos ou limites perto do estouro, eles aparecem aqui.",
      [{ href: "#orcamentos", label: "Revisar limites" }],
    );
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
    return renderEmptyState(
      "Sem despesas no mes",
      "Cadastre uma despesa para entender quais categorias pesam mais no seu dinheiro.",
      [{ href: "#novo-lancamento", label: "Lancar despesa" }],
    );
  }

  const total = rows.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let start = 0;
  const segments = rows.slice(0, 6).map((item) => {
    const end = start + Number(item.percent || 0);
    const segment = `${safeCssColor(item.color)} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    start = end;
    return segment;
  });
  const gradient = `conic-gradient(${segments.join(", ")})`;

  return `
      <section class="category-app-card">
        <div class="category-donut-wrap">
          <div class="category-donut" style="--category-donut:${gradient}">
            <span>Total gasto</span>
            <strong>${money(total)}</strong>
          </div>
        </div>
        <div class="category-app-list">
          ${rows.slice(0, 6).map((item) => `
            <div class="category-app-row">
              <span class="category-dot" style="--dot-color:${safeCssColor(item.color)}"></span>
              <strong>${esc(item.label)}</strong>
              <b class="money negative">${money(item.value)}</b>
              <small>${Math.round(Number(item.percent || 0))}%</small>
            </div>
          `).join("")}
        </div>
      </section>
    `;
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

function budgetStatusTone(item) {
  const monthly = Number(item.pct?.monthly || 0);
  const weekly = Number(item.pct?.weekly || 0);
  const peak = Math.max(monthly, weekly);
  if (peak >= 100) return "danger";
  if (peak >= 80) return "warning";
  return "ok";
}

function budgetStatusLabel(tone) {
  if (tone === "danger") return "Limite estourado";
  if (tone === "warning") return "Perto do limite";
  return "Dentro do plano";
}

export function renderBudgetOverviewHtml(rows) {
  if (!rows.length) {
    return renderEmptyState(
      "Nenhuma categoria para acompanhar",
      "Crie categorias de despesa em Ajustes para definir limites semanais e mensais.",
      [{ href: "#ajustes", label: "Criar categoria" }],
    );
  }

  return rows
    .map((item) => {
      const tone = budgetStatusTone(item);

      return `
          <article class="budget-card budget-card-${tone}">
            <header class="budget-card-header">
              <div>
                <strong>${esc(item.label)}</strong>
                <small>${esc(budgetStatusLabel(tone))}</small>
              </div>
              <div class="budget-badges">
                <span class="budget-badge">Semana ${item.status.weekly}</span>
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
        `;
    })
    .join("");
}

export function renderDailyHistoryHtml(history) {
  if (!history.length) {
    return renderEmptyState(
      "Seu historico ainda esta vazio",
      "Depois que voce cadastrar receitas, despesas ou investimentos, a rotina diaria aparece aqui.",
      [{ href: "#novo-lancamento", label: "Criar primeiro lancamento" }],
    );
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
