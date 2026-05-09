import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../../src/dashboard/index.js", import.meta.url), "utf8");
const templatesSource = readFileSync(new URL("../../src/dashboard/viewTemplates.js", import.meta.url), "utf8");

test("dashboard importa helpers usados no runtime", () => {
  const utilsImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*"\.\.\/core\/utils\.js";/);

  assert.ok(utilsImport, "dashboard deve importar helpers de core/utils");
  assert.match(utilsImport[1], /\bmonthKey\b/);
});

test("dashboard delega HTML repetitivo para templates de view", () => {
  assert.match(source, /from\s+"\.\/viewTemplates\.js"/);
  assert.match(templatesSource, /renderBudgetOverviewHtml/);
  assert.match(templatesSource, /renderDailyHistoryHtml/);
  assert.match(templatesSource, /\bparseLocalDate\b/);
});
