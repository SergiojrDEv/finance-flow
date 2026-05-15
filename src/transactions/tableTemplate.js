function defaultEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderTransactionTableHtml(items, helpers = {}) {
  const escapeHtml = helpers.escapeHtml || defaultEscape;
  const formatDate = helpers.formatDate || ((value) => value || "-");
  const formatMoney = helpers.formatMoney || ((value) => String(value || 0));
  const formatCategoryLabel = helpers.formatCategoryLabel || (() => "Sem categoria");

  if (!items.length) {
    return `
          <tr>
            <td colspan="11" class="empty-state app-empty-state table-empty-state">
              <strong class="empty-state-title">Nenhum lancamento encontrado</strong>
              <span class="empty-state-copy">Cadastre um novo movimento ou ajuste os filtros para ver os lancamentos do mes.</span>
            </td>
          </tr>
        `;
  }

  return items
    .map((item) => {
      const amountClass = item.presentation.amount.className;
      const sign = item.presentation.amount.sign;
      const typeLabel = item.presentation.typeLabel;
      const statusLabel = item.presentation.statusLabel;
      const dateLabel = item.date ? formatDate(item.date) : "-";
      const dueDateLabel = item.dueDate ? formatDate(item.dueDate) : "-";

      return `
          <tr class="transaction-row transaction-row-${item.type}">
            <td data-label="Data"><span class="cell-value">${dateLabel}</span></td>
            <td data-label="Descricao" class="transaction-main-cell">
              <strong>${escapeHtml(item.description)}</strong>
              <small>${escapeHtml(formatCategoryLabel(item))} | ${escapeHtml(item.presentation.originLabel || "Manual")}</small>
            </td>
            <td data-label="Categoria"><span class="category-pill">${escapeHtml(formatCategoryLabel(item))}</span></td>
            <td data-label="Origem"><span class="source-pill source-${escapeHtml(item.origin || "manual")}">${escapeHtml(item.presentation.originLabel || "Manual")}</span></td>
            <td data-label="Conta"><span class="cell-value">${escapeHtml(item.account)}</span></td>
            <td data-label="Status"><span class="type-pill ${item.status || "paid"}">${statusLabel}</span></td>
            <td data-label="Pagamento"><span class="payment-pill ${item.type}">${escapeHtml(item.presentation.flowLabel || item.presentation.paymentMethodLabel)}</span></td>
            <td data-label="Vencimento"><span class="cell-value">${dueDateLabel}</span></td>
            <td data-label="Tipo"><span class="type-pill ${item.type}">${typeLabel}</span></td>
            <td data-label="Valor" class="right money ${amountClass}"><span class="cell-value">${sign} ${formatMoney(Number(item.amount))}</span></td>
            <td data-label="Acoes" class="right">
              <div class="row-actions">
                ${item.status !== "paid" ? `<button class="row-action success" type="button" data-paid="${item.id}" title="Marcar como pago">Pago</button>` : ""}
                <button class="row-action neutral" type="button" data-edit="${item.id}" title="Editar">Editar</button>
                <button class="row-action" type="button" data-remove="${item.id}" aria-label="Remover lancamento">X</button>
              </div>
            </td>
          </tr>
        `;
    })
    .join("");
}
