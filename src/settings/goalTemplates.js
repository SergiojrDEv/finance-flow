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

export function renderGoalsHtml(goals) {
  if (!goals.length) {
    return `
          <article class="goal-card empty-state app-empty-state">
            <strong class="empty-state-title">Nenhuma meta criada ainda</strong>
            <span class="empty-state-copy">Crie uma meta para acompanhar aportes, progresso e quanto falta para chegar no valor desejado.</span>
          </article>
        `;
  }

  return goals
    .map((goal, index) => `
          <article class="goal-card">
            <header>
              <strong>${esc(goal.name)}</strong>
              <small>${goal.percent.toFixed(0)}%</small>
            </header>
            <div class="bar"><span style="--value:${goal.percent}%;--color:var(--invest)"></span></div>
            <p><span class="money purple">${money(goal.current)}</span> de ${money(goal.target)}</p>
            <small class="goal-card-note">Categoria: ${esc(goal.categoryName)}</small>
            <div class="goal-card-actions">
              <button class="mini-btn" type="button" data-goal-contribute="${index}">Lancar aporte</button>
              <button class="mini-btn" type="button" data-goal-edit-card="${index}">Editar meta</button>
            </div>
          </article>
        `)
    .join("");
}

export function renderGoalsSummaryHtml(summary) {
  return `
      <article class="mini-stat-card">
        <span>Metas ativas</span>
        <strong>${summary.activeCount}</strong>
        <small>${money(summary.totalTarget)} planejados</small>
      </article>
      <article class="mini-stat-card">
        <span>Ja acumulado</span>
        <strong>${money(summary.totalCurrent)}</strong>
        <small>${summary.totalTarget ? `${((summary.totalCurrent / summary.totalTarget) * 100).toFixed(1)}% do total` : "Comece pela primeira meta"}</small>
      </article>
      <article class="mini-stat-card">
        <span>Mais avancada</span>
        <strong>${summary.closest ? esc(summary.closest.name) : "Sem metas"}</strong>
        <small>${summary.closest ? `${Math.min(summary.closest.progress, 100).toFixed(0)}% concluido` : "Crie sua primeira meta"}</small>
      </article>
    `;
}
