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
