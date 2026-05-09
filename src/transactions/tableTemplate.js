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
            <td colspan="10" class="empty-state app-empty-state table-empty-state">
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
            <td>${dateLabel}</td>
            <td><strong>${escapeHtml(item.description)}</strong></td>
            <td><span class="category-pill">${escapeHtml(formatCategoryLabel(item))}</span></td>
            <td>${escapeHtml(item.account)}</td>
            <td><span class="type-pill ${item.status || "paid"}">${statusLabel}</span></td>
            <td><span class="payment-pill ${item.type}">${item.presentation.flowLabel || item.presentation.paymentMethodLabel}</span></td>
            <td>${dueDateLabel}</td>
            <td><span class="type-pill ${item.type}">${typeLabel}</span></td>
            <td class="right money ${amountClass}">${sign} ${formatMoney(Number(item.amount))}</td>
            <td class="right">
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
