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

export function renderWalletInstitutionsHtml(cards = [], formatMoney = (value) => String(value)) {
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
    <div class="wallet-institution-row">
      <span class="wallet-bank-mark">OF</span>
      <div>
        <strong>Open Finance</strong>
        <small>Modulo mock em preparacao</small>
      </div>
      <b>Local</b>
    </div>
    ${creditRows}
  `;
}

export function renderWalletReviewHtml(review = {}) {
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
