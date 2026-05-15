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
import { createDashboardDomWriter } from "./domWriter.js";
import { buildSmartDashboardView, buildSummaryView } from "./summaryPresenter.js";
import {
  renderBudgetOverviewHtml,
  renderCategoryBreakdownHtml,
  renderDailyHistoryHtml,
  renderInsightsHtml,
  renderTransactionHighlightsHtml,
} from "./viewTemplates.js";

export function createDashboardModule(deps) {
  const dom = createDashboardDomWriter();

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

    dom.setText("#income-total", view.totals.income);
    dom.setText("#home-income-mini", view.totals.income);
    dom.setText("#expense-total", view.totals.expenses);
    dom.setText("#home-expense-mini", view.totals.expenses);
    dom.setText("#invest-total", view.totals.investments);
    dom.setText("#home-invest-mini", view.totals.investments);
    dom.setText("#free-balance", view.totals.available);
    dom.setText("#home-free-balance", view.totals.available);
    dom.setText("#home-balance-copy", view.homeBalanceCopy);
    dom.setText("#income-count", view.counts.income);
    dom.setText("#expense-count", view.counts.expenseCategories);
    dom.setText("#invest-rate", view.rates.investment);
    dom.setText("#commitment-rate", view.rates.commitment);
    dom.setText("#health-score", view.health.score);
    dom.setText("#health-copy", view.health.copy);
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

    dom.setText("#daily-safe", view.dailySafe);
    dom.setText("#month-comparison", view.monthComparison);
    dom.setText("#smart-title", view.title);
    dom.setText("#smart-copy", view.copy);
    renderInsights(transactions, totals);
  }

  function renderInsights(transactions, totals) {
    const budgetRules = Object.fromEntries(
      state.settings.categories.expense.map(([key]) => [key, getBudgetRule(key)])
    );
    const insights = buildDashboardInsights({
      transactions,
      expenseCategories: state.settings.categories.expense,
      budgetRules,
      totals,
    });

    dom.setHtml("#insight-list", renderInsightsHtml(insights));
  }

  function renderCategoryBreakdown() {
    const rows = buildCategoryBreakdownRows({
      transactions: getMonthTransactions(),
      categories: state.settings.categories.expense,
    });
    dom.setText("#category-period", state.currentDate.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    }));
    dom.setHtml("#category-breakdown", renderCategoryBreakdownHtml(rows));
  }

  function renderTransactionHighlights() {
    const target = dom.get("#transaction-highlights");
    if (!target) return;

    const highlights = buildTransactionHighlights(getMonthTransactions());

    dom.setHtml("#transaction-highlights", renderTransactionHighlightsHtml(highlights));
  }

  function renderBudgets() {
    const budgetRules = Object.fromEntries(
      state.settings.categories.expense.map(([key]) => [key, getBudgetRule(key)])
    );
    const rows = buildBudgetOverview({
      transactions: getMonthTransactions(),
      categories: state.settings.categories.expense,
      budgetRules,
      currentDate: state.currentDate,
    });
    dom.setHtml("#budget-list", renderBudgetOverviewHtml(rows));
  }

  function renderDailyHistory() {
    const target = dom.get("#daily-history-list");
    if (!target) return;

    const history = buildDailyHistory(getMonthTransactions());

    dom.setHtml("#daily-history-list", renderDailyHistoryHtml(history));
  }

  function renderChart() {
    const canvas = dom.get("#cashflow-chart");
    if (!canvas || !window.Chart) {
      dom.setText("#trend-status", "Grafico indisponivel");
      return;
    }

    const months = buildCashflowSeries({
      transactions: state.transactions,
      currentDate: state.currentDate,
    });
    const view = buildCashflowChartView(months);

    dom.setText("#trend-status", view.status);

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
    renderSafely("carteira", deps.renderWallet);
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
