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
} from "../core/utils.js";
import { buildCashflowChartView } from "./chartPresenter.js";
import { buildSmartDashboardView, buildSummaryView } from "./summaryPresenter.js";
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
    const view = buildSummaryView({ transactions, summary });

    document.querySelector("#income-total").textContent = view.totals.income;
    document.querySelector("#expense-total").textContent = view.totals.expenses;
    document.querySelector("#invest-total").textContent = view.totals.investments;
    document.querySelector("#free-balance").textContent = view.totals.available;
    document.querySelector("#income-count").textContent = view.counts.income;
    document.querySelector("#expense-count").textContent = view.counts.expenseCategories;
    document.querySelector("#invest-rate").textContent = view.rates.investment;
    document.querySelector("#commitment-rate").textContent = view.rates.commitment;
    document.querySelector("#health-score").textContent = view.health.score;
    document.querySelector("#health-copy").textContent = view.health.copy;
    renderSmartDashboard(transactions, view.totalsForInsights, view.free);
  }

  function renderSmartDashboard(transactions, totals, free) {
    const previousDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
    const previousSummary = buildFinancialSummary(getMonthTransactions(previousDate));
    const view = buildSmartDashboardView({
      transactions,
      totals,
      free,
      currentDate: state.currentDate,
      previousSummary,
    });

    document.querySelector("#daily-safe").textContent = view.dailySafe;
    document.querySelector("#month-comparison").textContent = view.monthComparison;
    document.querySelector("#smart-title").textContent = view.title;
    document.querySelector("#smart-copy").textContent = view.copy;
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
    const view = buildCashflowChartView(months);

    document.querySelector("#trend-status").textContent = view.status;

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas, view.config);
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
