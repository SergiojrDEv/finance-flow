import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const stylesPath = path.join(rootDir, "src", "styles.css");

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
    "body {\n    padding-bottom: 82px;",
    ".sidebar {\n    position: fixed;\n    inset: auto 0 0;",
    "backdrop-filter: blur(16px);",
    ".nav-list {\n    grid-template-columns: repeat(6, minmax(0, 1fr));",
    ".nav-item {\n    min-height: 54px;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles mantem resumo principal compacto", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".summary-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;",
    ".metric-card {\n  position: relative;\n  overflow: hidden;\n  padding: 16px 16px 15px;",
    "box-shadow: var(--shadow-soft);",
    ".metric-card {\n    padding: 14px 14px 13px;",
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
    ".budget-rule-form {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;",
    ".budget-rule-form input {\n  min-width: 0;\n  min-height: 36px;",
    ".goal-card {\n  display: grid;\n  gap: 10px;",
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});

test("styles organizam ajustes como area de app", async () => {
  const source = await readFile(stylesPath, "utf8");
  const requiredSnippets = [
    ".settings-grid {\n  margin-bottom: 14px;",
    ".settings-manage-shell {\n  display: grid;\n  gap: 14px;",
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
