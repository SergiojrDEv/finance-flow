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
