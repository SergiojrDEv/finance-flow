import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stylesPath = path.join(rootDir, "src", "styles.css");
const indexPath = path.join(rootDir, "index.html");

test("styles define tokens base do design system", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredTokens = [
    "--color-bg",
    "--color-surface",
    "--color-text",
    "--color-muted",
    "--color-line",
    "--color-income",
    "--color-expense",
    "--color-invest",
    "--color-focus",
    "--shadow-soft",
    "--shadow-raised",
    "--radius-xs",
    "--radius-sm",
    "--radius-md",
    "--radius-pill",
    "--space-1",
    "--space-7",
  ];

  const missing = requiredTokens.filter((token) => !source.includes(token));

  assert.deepEqual(missing, []);
});

test("legacy visual tokens apontam para tokens semanticos", async () => {
  const source = await readFile(stylesPath, "utf8");
  const expectedAliases = [
    "--bg: var(--color-bg)",
    "--surface: var(--color-surface)",
    "--text: var(--color-text)",
    "--income: var(--color-income)",
    "--expense: var(--color-expense)",
    "--invest: var(--color-invest)",
    "--shadow: var(--shadow-raised)",
  ];
  const missing = expectedAliases.filter((alias) => !source.includes(alias));

  assert.deepEqual(missing, []);
});

test("styles mantem cards discretos e sem letter spacing negativo", async () => {
  const source = await readFile(stylesPath, "utf8");

  assert.equal(/border-radius:\s*(10|11|12|13|14|15|16)px/.test(source), false);
  assert.equal(/letter-spacing:\s*-/.test(source), false);
});

test("styles preparam navegacao mobile com barra inferior de app", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    "@media (max-width: 760px)",
    "body {\n    padding-bottom: 92px;",
    ".sidebar {\n    position: fixed;\n    inset: auto 0 0;",
    "backdrop-filter: blur(16px);",
    ".nav-list {\n    grid-template-columns: repeat(5, minmax(0, 1fr));",
    '.nav-item[data-section="orcamentos"],\n  .nav-item[data-section="relatorios"] {\n    display: none;',
    ".nav-item {\n    min-height: 54px;",
    ".nav-item::before {\n    content: attr(data-mobile-icon);",
    ".nav-item::after {\n    content: attr(data-mobile-label);",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html oferece rotulos curtos para navegacao mobile", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    'data-mobile-label="Inicio"',
    'data-mobile-label="Carteira"',
    'data-mobile-label="Lancar"',
    'data-mobile-label="Limites"',
    'data-mobile-label="Metas"',
    'data-mobile-label="Historico"',
    'data-mobile-label="Ajustes"',
    'data-mobile-icon="+"',
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html oferece base visual de carteira financeira", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    'id="carteira"',
    "wallet-hero",
    "wallet-balance-card",
    "wallet-trust-card",
    "Nada entra no historico antes da sua revisao",
    "Mock local agora | Provider real depois",
    'id="wallet-account-cards"',
    'id="wallet-institution-list"',
    "wallet-review-list",
    'id="wallet-review-list"',
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles suportam tela carteira app-like", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".wallet-hero {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);",
    ".wallet-balance-card {\n  display: grid;",
    ".wallet-guide-strip {\n  display: grid;",
    ".wallet-trust-card {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;",
    ".wallet-trust-card small {\n  grid-row: 1 / span 2;",
    ".wallet-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".wallet-account-card {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;",
    ".wallet-panels {\n  display: grid;\n  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);",
    ".wallet-empty-state {\n  display: grid;",
    ".wallet-institution-row {\n  display: grid;",
    ".wallet-review-row {\n  display: grid;",
    ".wallet-hero,\n  .wallet-top-grid,\n  .wallet-grid,\n  .wallet-panels,\n  .wallet-bank-options,",
    ".wallet-trust-card {\n    grid-template-columns: 1fr;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html oferece home inspirada em app financeiro", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    "finance-home-hero",
    "app-home-status",
    "Formula da disponibilidade",
    "home-free-balance",
    "home-mini-cards",
    "home-income-mini",
    "home-expense-mini",
    "home-invest-mini",
    "quick-action-grid",
    "mobile-secondary-actions",
    "Limites da semana",
    "Historico completo",
    "category-panel",
    "Onde foi seu dinheiro",
    "category-period",
    'data-quick-type="income"',
    'data-quick-type="expense"',
    'data-quick-type="investment"',
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles mantem resumo principal compacto", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".finance-home-hero {\n  position: relative;\n  overflow: hidden;",
    ".app-home-status {\n  width: fit-content;",
    ".home-mini-cards {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".home-mini-card {\n  display: grid;",
    "grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);",
    "linear-gradient(135deg, rgba(11, 114, 133, 0.26), transparent 46%),",
    ".quick-action-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));",
    ".quick-action {\n  position: relative;\n  overflow: hidden;",
    "border-left: 4px solid transparent;",
    ".quick-action::after {\n  content: \">\";",
    ".mobile-secondary-actions {\n  display: none;",
    ".mobile-secondary-actions {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));",
    ".quick-action.income {\n  border-left-color: var(--income);",
    ".quick-action.income span,\n.metric-card.income i {",
    ".quick-action.expense {\n  border-left-color: var(--expense);",
    ".quick-action.invest {\n  border-left-color: var(--invest);",
    ".quick-action.goal {\n  border-left-color: var(--balance);",
    ".summary-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;",
    ".metric-card {\n  position: relative;\n  overflow: hidden;\n  display: grid;",
    "grid-template-columns: minmax(0, 1fr) auto;",
    ".metric-card::after {\n  content: \"\";",
    ".quick-action:hover {\n  transform: translateY(-2px);",
    "box-shadow: var(--shadow-soft);",
    ".summary-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));",
    ".home-mini-cards {\n    grid-template-columns: 1fr;",
    ".quick-action {\n    grid-template-columns: auto minmax(0, 1fr) auto;",
    ".metric-card {\n    min-height: 102px;",
    '.nav-item[data-section="novo-lancamento"] {\n    min-height: 62px;',
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles refinam distribuicao por categoria como card de app", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".category-panel {\n  overflow: hidden;",
    ".month-chip {\n  min-height: 32px;",
    ".category-app-card {\n  position: relative;\n  display: grid;",
    "linear-gradient(135deg, rgba(11, 114, 133, 0.07), transparent 42%),",
    ".category-app-copy {\n  grid-column: 1 / -1;",
    ".category-app-row {\n  display: grid;",
    "box-shadow: inset 0 0 0 1px rgba(217, 226, 236, 0.75);",
    ".category-app-card {\n    grid-template-columns: 1fr;\n    padding: 12px;\n    overflow: hidden;",
    ".category-panel-header,\n  .category-app-copy {\n    display: grid;",
    ".category-app-row {\n    grid-template-columns: auto minmax(0, 1fr);\n    gap: 6px 8px;",
    ".category-app-row small {\n    grid-column: 2;\n    grid-row: 3;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles reforcam topo mobile como barra de aplicativo", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".topbar {\n    gap: 14px;\n    margin: 0 -14px 18px;",
    "background: #152238;",
    ".topbar h1 {\n    font-size: 1.36rem;",
    ".topbar .eyebrow {\n    color: rgba(255, 255, 255, 0.72);",
    ".topbar-copy {\n    max-width: none;\n    color: rgba(255, 255, 255, 0.72);",
    ".topbar .icon-btn {\n    border-color: rgba(255, 255, 255, 0.16);",
    ".topbar .danger-btn {\n    flex: 0 0 auto;",
    ".topbar-actions .screen-action {\n    grid-column: 1 / -1;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles compactam areas de leitura no mobile", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".smart-grid,\n  .dashboard-grid,\n  .transactions-shell {\n    gap: 12px;",
    ".panel {\n    padding: 14px;",
    ".panel-header {\n    gap: 10px;\n    margin-bottom: 12px;",
    ".smart-copy {\n    margin-bottom: 12px;\n    font-size: 0.95rem;",
    ".transaction-highlights {\n    grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".mini-stat-card {\n    min-height: 86px;",
    ".mini-stat-card strong {\n    font-size: 0.9rem;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles deixam lancamentos mais compactos em desktop e mobile", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".transactions-shell {\n  display: grid;\n  gap: 14px;",
    ".transaction-hero {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  padding: 16px;",
    ".transaction-view-tabs {\n  min-width: 196px;",
    ".view-tab {\n  min-height: 34px;",
    ".transaction-highlights {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 10px;",
    ".mini-stat-card {\n  display: grid;\n  gap: 5px;\n  padding: 12px;",
    ".transaction-highlights .mini-stat-card {\n  grid-template-columns: auto minmax(0, 1fr);",
    ".transaction-highlights .mini-stat-card .stat-icon {\n  grid-row: 1 / span 4;",
    ".transaction-view-tabs {\n    width: 100%;\n    min-width: 0;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles reduzem altura do formulario de lancamento", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".transaction-composer .panel-header {\n  margin-bottom: 14px;",
    ".transaction-composer .segmented-control {\n  margin-bottom: 14px;",
    ".transaction-composer label {\n  gap: 6px;\n  margin-bottom: 12px;",
    ".transaction-composer input,\n.transaction-composer select {\n  min-height: 40px;",
    ".transaction-flow-steps {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".transaction-flow-steps .is-active {\n  border-color: rgba(21, 34, 56, 0.2);",
    ".transaction-flow-steps {\n    grid-template-columns: 1fr;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html mostra fluxo guiado no formulario de lancamento", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    "transaction-flow-steps",
    "Etapas do lancamento",
    "1. Tipo",
    "2. Detalhes",
    "3. Revisar",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html contextualiza lancamentos do mes como extrato", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    "Acompanhe o extrato do periodo",
    "filtre rapidamente",
    "ajuste qualquer movimento",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles deixam historico em tabela mais limpo", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".table-scroll {\n  overflow-x: auto;\n  border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n  background: #ffffff;",
    "border-collapse: separate;\n  border-spacing: 0;",
    "th {\n  padding: 9px 10px;\n  border-bottom: 1px solid var(--line);\n  background: #fbfcfe;",
    "td {\n  padding: 10px;",
    "tbody tr:hover td {\n  background: #fbfcfe;",
    "tbody tr:last-child td {\n  border-bottom: 0;",
    ".row-actions {\n  display: inline-flex;\n  gap: 4px;",
    ".row-action {\n  min-width: 32px;\n  height: 30px;",
    ".transaction-main-cell {\n    display: grid !important;",
    ".transaction-row td:first-child {\n  border-left: 4px solid transparent;",
    ".transaction-row-income td:first-child {\n  border-left-color: var(--income);",
    ".transaction-row::before {\n    content: \"\";",
    ".transaction-row td::before {\n    content: attr(data-label);",
    ".transaction-main-cell small {\n    display: block;",
    ".payment-pill.investment {\n  background: #efefff;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles compactam orcamentos e metas sem mudar layout estrutural", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".budget-grid,\n.goals-grid,\n.settings-grid,\n.settings-lists {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 12px;",
    ".metas-shell {\n  display: grid;\n  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);\n  gap: 16px;",
    ".metas-content {\n  display: grid;\n  gap: 14px;",
    ".goal-summary-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 10px;",
    ".budget-card,\n.goal-card,\n.manage-item {\n  padding: 14px;",
    ".budget-card::before,\n.goal-progress-card::before {\n  content: \"\";",
    ".budget-card-warning::before {\n  background: #f59f00;",
    ".budget-card-danger::before {\n  background: var(--expense);",
    ".budget-rule-form {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;",
    "border: 1px solid var(--line);\n  border-radius: var(--radius-md);\n  padding: 10px;",
    ".budget-rule-details {\n  margin-top: 2px;",
    ".budget-rule-details summary {\n  min-height: 34px;",
    ".budget-rule-form input {\n  min-width: 0;\n  min-height: 36px;",
    ".goal-card {\n  position: relative;\n  overflow: hidden;\n  display: grid;",
    ".goal-flow-card {\n  display: grid;\n  gap: 8px;",
    ".goal-flow-card span {\n  display: grid;",
    ".goal-progress-card {\n  padding-left: 18px;",
    ".goal-plan-row {\n  display: flex;",
    ".goal-percent {\n  min-width: 44px;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles organizam ajustes como area de app", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".settings-grid {\n  margin-bottom: 14px;",
    ".settings-manage-shell {\n  display: grid;\n  gap: 14px;",
    ".settings-flow-card {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".settings-flow-card span {\n  min-width: 0;",
    ".manage-switcher {\n  display: grid;\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  gap: 6px;\n  padding: 5px;",
    ".manage-tab {\n  min-height: 34px;\n  padding: 0 10px;\n  border: 0;\n  border-radius: var(--radius-sm);",
    ".manage-tab.is-active {\n  background: var(--text);\n  color: #ffffff;",
    ".manage-list {\n  display: grid;\n  gap: 8px;",
    ".manage-item {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: 6px 10px;",
    ".mini-actions {\n  display: flex;\n  gap: 5px;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles finalizam relatorios e responsividade da fase de app", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".daily-history-list {\n  display: grid;\n  gap: 14px;\n  position: relative;",
    ".report-review-card {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    ".report-review-card span {\n  min-width: 0;",
    ".history-day-card {\n  position: relative;\n  padding: 14px;",
    ".timeline-card::before {\n  content: \"\";",
    ".history-day-header {\n  display: flex;\n  justify-content: space-between;\n  gap: 12px;",
    ".history-day-totals {\n  display: grid;\n  gap: 4px;",
    ".history-day-items {\n  display: grid;\n  gap: 9px;",
    ".history-row {\n  position: relative;\n  display: grid;\n  grid-template-columns: 18px minmax(0, 1fr) auto;",
    ".history-dot {\n  width: 10px;",
    ".history-type-pill {\n  display: inline-flex;",
    ".manage-switcher {\n    grid-template-columns: 1fr;\n    padding: 4px;",
    ".settings-flow-card {\n    grid-template-columns: 1fr;",
    ".report-review-card {\n    grid-template-columns: 1fr;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles suportam estados vazios guiados", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".app-empty-state {\n  display: grid;\n  gap: 6px;\n  place-items: center;",
    "border: 1px dashed var(--line);",
    ".empty-state-title {\n  color: var(--text);\n  font-size: 0.95rem;",
    ".empty-state-copy {\n  max-width: 420px;\n  line-height: 1.45;",
    ".empty-state-actions {\n  display: flex;",
    ".empty-state-actions a {\n  min-height: 34px;",
    ".table-empty-state {\n  min-width: 360px;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles diferenciam tipo de lancamento com guia visual", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".transaction-type-guide {\n  display: grid;\n  gap: 4px;\n  margin: -4px 0 14px;",
    ".transaction-flow-steps span {\n  min-width: 0;",
    ".transaction-intent-card {\n  display: grid;\n  gap: 9px;",
    ".transaction-intent-card > div {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));",
    "border-left: 4px solid var(--expense);",
    "body[data-transaction-type-tone=\"income\"] .transaction-type-guide {\n  border-left-color: var(--income);",
    "body[data-transaction-type-tone=\"income\"] .transaction-intent-card {",
    "body[data-transaction-type-tone=\"investment\"] .transaction-type-guide {\n  border-left-color: var(--invest);",
    "body[data-transaction-type-tone=\"investment\"] .transaction-intent-card {",
    "body[data-transaction-type-tone=\"expense\"] .transaction-type-guide {\n  border-left-color: var(--expense);",
    "body[data-transaction-type-tone=\"expense\"] .transaction-intent-card {",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("html diferencia metas como area de planejamento", async () => {
  const source = await readFile(indexPath, "utf8");
  const requiredSnippets = [
    "goals-hero",
    "Transforme aportes em objetivos visiveis",
    "Escolha um objetivo, defina o valor alvo",
    "Lancar aporte",
    'data-quick-type="investment"',
    "goal-flow-card",
    "1. Crie o objetivo",
    "2. Lance aportes",
    "3. Acompanhe o progresso",
    "Use esta tela como linha do tempo",
    "Defina quanto quer gastar por semana e por mes",
    "Centralize nomes, cores, contas, cartoes e etiquetas",
    "settings-flow-card",
    "Desativar quando nao usar",
    "Como revisar o historico",
    "1. Confira o dia",
    "2. Revise valores",
    "3. Exporte se precisar",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});
