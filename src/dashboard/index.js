import { state } from "../core/state.js";
import { buildBudgetOverview } from "../application/dashboard/buildBudgetOverview.js";
import { buildCategoryBreakdown as buildCategoryBreakdownRows } from "../application/dashboard/buildCategoryBreakdown.js";
import { buildCashflowSeries } from "../application/dashboard/buildCashflowSeries.js";
import { buildDailyHistory } from "../application/dashboard/buildDailyHistory.js";
import { buildDashboardInsights } from "../application/dashboard/buildDashboardInsights.js";
import { buildFinancialSummary } from "../application/dashboard/buildFinancialSummary.js";
import { buildTransactionHighlights } from "../application/dashboard/buildTransactionHighlights.js";
import {
  getBudgetRule,
  getMonthTransactions,
  money,
  monthKey,
} from "../core/utils.js";
import {
  renderBudgetOverviewHtml,
  renderCategoryBreakdownHtml,
  renderDailyHistoryHtml,
  renderInsightsHtml,
  renderTransactionHighlightsHtml,
} from "./viewTemplates.js";

export function createDashboardModule(deps) {
  function renderSafely(name, renderFn) {
    try {
      renderFn();
    } catch (error) {
      console.error(`Erro ao renderizar ${name}`, error);
      deps.notify?.(`Nao foi possivel atualizar ${name}.`);
    }
  }

  function renderMonthLabel() {
    deps.els.currentMonth.textContent = state.currentDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  function renderSummary() {
    const transactions = getMonthTransactions();
    const summary = buildFinancialSummary(transactions);
    const totals = {
      income: summary.totals.income,
      expense: summary.totals.expenses,
      investment: summary.totals.investments,
    };
    const free = summary.totals.available;

    document.querySelector("#income-total").textContent = money(summary.totals.income);
    document.querySelector("#expense-total").textContent = money(summary.totals.expenses);
    document.querySelector("#invest-total").textContent = money(summary.totals.investments);
    document.querySelector("#free-balance").textContent = money(summary.totals.available);
    document.querySelector("#income-count").textContent = `${summary.counts.income} lancamentos`;
    document.querySelector("#expense-count").textContent = `${summary.counts.expenseCategories} categorias`;
    document.querySelector("#invest-rate").textContent = `${summary.rates.investmentRate.toFixed(1)}% da receita direcionado para investimento`;
    document.querySelector("#commitment-rate").textContent = `${summary.rates.commitmentRate.toFixed(1)}% da receita ja foi comprometida`;
    document.querySelector("#health-score").textContent = `${summary.health.score}%`;
    document.querySelector("#health-copy").textContent = summary.health.status === "negative"
      ? `Mes no vermelho: depois de despesas e investimentos, faltam ${money(Math.abs(free))} para o disponivel imediato fechar positivo.`
      : summary.health.copy;
    renderSmartDashboard(transactions, totals, free);
  }

  function renderSmartDashboard(transactions, totals, free) {
    const today = new Date();
    const currentMonth = monthKey(state.currentDate) === monthKey(today);
    const daysInMonth = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0).getDate();
    const dayRef = currentMonth ? today.getDate() : 1;
    const remainingDays = Math.max(1, daysInMonth - dayRef + 1);
    const dailySafe = Math.max(0, free / remainingDays);
    const previousDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    const previousSummary = buildFinancialSummary(getMonthTransactions(previousDate));
    const previousTotals = {
      income: previousSummary.totals.income,
      expense: previousSummary.totals.expenses,
      investment: previousSummary.totals.investments,
    };
    const previousFree = previousSummary.totals.available;
    const freeDelta = free - previousFree;
    const commitment = totals.income ? ((totals.expense + totals.investment) / totals.income) * 100 : 0;
    const investRate = totals.income ? (totals.investment / totals.income) * 100 : 0;

    document.querySelector("#daily-safe").textContent = money(dailySafe);
    document.querySelector("#month-comparison").textContent = previousTotals.income || previousTotals.expense
      ? `${freeDelta >= 0 ? "+" : ""}${money(freeDelta)}`
      : "Sem historico";

    let title = "Seu mes esta em construcao";
    let copy = "Registre receitas, despesas e investimentos para entender o que ainda fica disponivel para movimentacao imediata.";
    if (transactions.length) {
      if (free < 0) {
        title = "Atencao ao saldo do mes";
        copy = `No ritmo atual, o mes fecha com ${money(Math.abs(free))} a menos no disponivel imediato. Revise gastos pendentes e categorias acima do limite.`;
      } else if (commitment > 80) {
        title = "Mes apertado, mas ainda controlavel";
        copy = `Voce ainda tem ${money(free)} disponivel para movimentacao e pode usar cerca de ${money(dailySafe)} por dia ate o fim do mes.`;
      } else {
        title = "Seu mes esta sob controle";
        copy = `Voce tem ${money(free)} disponivel para movimentacao, comprometeu ${commitment.toFixed(1)}% da receita e direcionou ${investRate.toFixed(1)}% para investimento.`;
      }
    }
    document.querySelector("#smart-title").textContent = title;
    document.querySelector("#smart-copy").textContent = copy;
    renderInsights(transactions, totals);
  }

  function renderInsights(transactions, totals) {
    const target = document.querySelector("#insight-list");
    const budgetRules = Object.fromEntries(
      state.settings.categories.expense.map(([key]) => [key, getBudgetRule(key)])
    );
    const insights = buildDashboardInsights({
      transactions,
      expenseCategories: state.settings.categories.expense,
      budgetRules,
      totals,
    });

    target.innerHTML = renderInsightsHtml(insights);
  }

  function renderCategoryBreakdown() {
    const rows = buildCategoryBreakdownRows({
      transactions: getMonthTransactions(),
      categories: state.settings.categories.expense,
    });
    const target = document.querySelector("#category-breakdown");

    target.innerHTML = renderCategoryBreakdownHtml(rows);
  }

  function renderTransactionHighlights() {
    const target = document.querySelector("#transaction-highlights");
    if (!target) return;

    const highlights = buildTransactionHighlights(getMonthTransactions());

    target.innerHTML = renderTransactionHighlightsHtml(highlights);
  }

  function renderBudgets() {
    const target = document.querySelector("#budget-list");
    const budgetRules = Object.fromEntries(
      state.settings.categories.expense.map(([key]) => [key, getBudgetRule(key)])
    );
    const rows = buildBudgetOverview({
      transactions: getMonthTransactions(),
      categories: state.settings.categories.expense,
      budgetRules,
      currentDate: state.currentDate,
    });
    target.innerHTML = renderBudgetOverviewHtml(rows);
  }

  function renderDailyHistory() {
    const target = document.querySelector("#daily-history-list");
    if (!target) return;

    const history = buildDailyHistory(getMonthTransactions());

    target.innerHTML = renderDailyHistoryHtml(history);
  }

  function renderChart() {
    const canvas = document.querySelector("#cashflow-chart");
    if (!canvas || !window.Chart) {
      document.querySelector("#trend-status").textContent = "Grafico indisponivel";
      return;
    }

    const months = buildCashflowSeries({
      transactions: state.transactions,
      currentDate: state.currentDate,
    });

    const last = months.at(-1);
    document.querySelector("#trend-status").textContent = last.free >= 0 ? "Saldo positivo" : "Saldo negativo";

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: months.map((item) => item.label),
        datasets: [
          { label: "Receitas", data: months.map((item) => item.income), borderColor: "#168a5b", backgroundColor: "rgba(22,138,91,.08)", tension: 0.35, fill: true },
          { label: "Despesas", data: months.map((item) => item.expense), borderColor: "#c43d4b", backgroundColor: "rgba(196,61,75,.08)", tension: 0.35, fill: true },
          { label: "Saldo livre", data: months.map((item) => item.free), borderColor: "#0b7285", tension: 0.35, borderWidth: 3 },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}` } },
        },
        scales: {
          y: { ticks: { callback: (value) => money(value).replace(",00", "") } },
        },
      },
    });
  }

  function renderAll() {
    renderSafely("mes", renderMonthLabel);
    renderSafely("resumo", renderSummary);
    renderSafely("categorias", renderCategoryBreakdown);
    renderSafely("destaques", renderTransactionHighlights);
    renderSafely("lancamentos", deps.renderTable);
    renderSafely("orcamentos", renderBudgets);
    renderSafely("historico", renderDailyHistory);
    renderSafely("resumo de metas", deps.renderGoalsSummary);
    renderSafely("metas", deps.renderGoals);
    renderSafely("ajustes", deps.renderSettings);
    renderSafely("grafico", renderChart);
  }

  return {
    renderMonthLabel,
    renderSummary,
    renderSmartDashboard,
    renderInsights,
    renderCategoryBreakdown,
    renderTransactionHighlights,
    renderBudgets,
    renderDailyHistory,
    renderChart,
    renderAll,
  };
}
