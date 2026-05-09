function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderWalletAccountsHtml(rows = [], formatMoney = (value) => String(value)) {
  if (!rows.length) {
    return `
      <div class="wallet-empty-state">
        <strong>Nenhuma conta cadastrada</strong>
        <span>Adicione contas em Ajustes para acompanhar saldos nesta tela.</span>
      </div>
    `;
  }

  return rows.map((row) => `
    <article class="wallet-account-card ${esc(row.tone)}">
      <span class="wallet-bank-mark">${esc(row.name.slice(0, 2))}</span>
      <div>
        <strong>${esc(row.name)}</strong>
        <small>${esc(row.caption)}</small>
      </div>
      <b>${formatMoney(row.balance)}</b>
    </article>
  `).join("");
}

export function renderWalletEmptyStateHtml() {
  return `
    <section class="wallet-openfinance-empty">
      <strong>Nenhum banco conectado ainda</strong>
      <span>Conecte sua primeira instituicao para ver saldo agregado, transacoes automaticas e analises por categoria.</span>
      <button class="primary-btn" id="wallet-empty-connect-bank" type="button">+ Conectar primeiro banco</button>
      <small>Open Finance regulado pelo Banco Central. Voce pode revogar o acesso quando quiser.</small>
    </section>
  `;
}

export function renderWalletInstitutionsHtml(institutions = [], cards = [], formatMoney = (value) => String(value)) {
  if (!institutions.length) {
    return `
      <div class="wallet-empty-state">
        <strong>Nenhum banco conectado ainda</strong>
        <span>Use o botao Conectar banco para iniciar uma conexao mock local.</span>
      </div>
    `;
  }

  const institutionRows = institutions.map((institution) => `
    <div class="wallet-connected-bank">
      <div class="wallet-connected-bank-head">
        <span class="wallet-bank-mark bank-${esc(institution.institutionId)}">${esc(institution.name.slice(0, 1))}</span>
        <div>
          <strong>${esc(institution.name)}</strong>
          <small>Sincronizado agora</small>
        </div>
        <button class="ghost-btn wallet-disconnect-bank" type="button" data-wallet-disconnect="${esc(institution.id)}">Desconectar</button>
      </div>
      <strong class="wallet-bank-balance">${formatMoney(institution.balance)}</strong>
      <div class="wallet-bank-accounts">
        <span>Conta corrente</span>
        <b>${formatMoney(institution.accountBalance)}</b>
        <span>Cartao de credito</span>
        <b class="negative">${formatMoney(-institution.creditBalance)}</b>
      </div>
    </div>
  `).join("");

  const creditRows = cards.map((card) => `
    <div class="wallet-institution-row">
      <span class="wallet-bank-mark">Cr</span>
      <div>
        <strong>${esc(card.name)}</strong>
        <small>${esc(card.caption)}</small>
      </div>
      <b>${formatMoney(card.amount)}</b>
    </div>
  `).join("");

  return `
    ${institutionRows}
    ${creditRows}
  `;
}

export function renderWalletReviewHtml(review = {}, pendingImported = [], formatMoney = (value) => String(value)) {
  if (pendingImported.length) {
    return pendingImported.map((transaction) => `
      <div class="wallet-pending-transaction">
        <div>
          <strong>${esc(transaction.description)}</strong>
          <small>${esc(transaction.date)} · Importado do banco</small>
        </div>
        <b class="${transaction.type === "income" ? "positive" : "negative"}">${transaction.type === "income" ? "+" : "-"} ${formatMoney(transaction.amount)}</b>
      </div>
    `).join("");
  }

  const rows = [
    ["Transacoes importadas", "Aparecerao aqui antes de entrar no historico", review.imported || 0],
    ["Casamentos automaticos", "Evita duplicar lancamentos manuais", review.matched || 0],
    ["Contas locais", "Base atual usada para montar a carteira", review.manualAccounts || 0],
  ];

  return rows.map(([title, copy, value], index) => `
    <div class="wallet-review-row">
      <span${index === 1 ? ' class="accent"' : ""}></span>
      <div>
        <strong>${esc(title)}</strong>
        <small>${esc(copy)}</small>
      </div>
      <b>${esc(value)}</b>
    </div>
  `).join("");
}

export function renderWalletInstitutionOptionsHtml(institutions = []) {
  return institutions.map((institution) => `
    <button class="wallet-bank-option" type="button" data-wallet-bank="${esc(institution.id)}">
      <span class="wallet-bank-mark" style="--bank-color: ${esc(institution.color)}">${esc(institution.mark)}</span>
      <strong>${esc(institution.name)}</strong>
    </button>
  `).join("");
}
