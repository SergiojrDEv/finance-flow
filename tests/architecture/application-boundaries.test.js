import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const applicationDir = path.join(rootDir, "src", "application");

const forbiddenSourcePatterns = [
  { pattern: /\bdocument\b/, reason: "DOM nao pertence a src/application" },
  { pattern: /\bwindow\b/, reason: "browser global nao pertence a src/application" },
  { pattern: /\blocalStorage\b/, reason: "storage concreto deve ficar em infraestrutura/core" },
  { pattern: /\bsupabase\b/i, reason: "cliente Supabase deve ficar em infraestrutura" },
];

const forbiddenImportPatterns = [
  { pattern: /["']\.\.\/\.\.\/core\//, reason: "src/application nao deve importar src/core" },
  { pattern: /["']\.\.\/\.\.\/infrastructure\//, reason: "src/application nao deve importar infraestrutura" },
  { pattern: /["']\.\.\/\.\.\/auth\//, reason: "src/application nao deve importar UI de auth" },
  { pattern: /["']\.\.\/\.\.\/dashboard\//, reason: "src/application nao deve importar UI de dashboard" },
  { pattern: /["']\.\.\/\.\.\/settings\//, reason: "src/application nao deve importar UI de ajustes" },
  { pattern: /["']\.\.\/\.\.\/supabase\//, reason: "src/application nao deve importar Supabase" },
  { pattern: /["']\.\.\/\.\.\/transactions\//, reason: "src/application nao deve importar UI de lancamentos" },
];

const allowedManualResultFiles = new Set([
  "src/application/shared/result.js",
]);

async function listApplicationSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listApplicationSourceFiles(fullPath);
    if (entry.isFile() && [".js", ".ts"].includes(path.extname(entry.name))) return [fullPath];
    return [];
  }));
  return files.flat();
}

test("src/application nao depende de DOM, Supabase, storage concreto ou UI", async () => {
  const files = await listApplicationSourceFiles(applicationDir);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");

    for (const check of forbiddenSourcePatterns) {
      if (check.pattern.test(source)) {
        violations.push(`${relativePath}: ${check.reason}`);
      }
    }

    const imports = source.matchAll(/import\s+[^;]+from\s+["'][^"']+["']/g);
    for (const match of imports) {
      for (const check of forbiddenImportPatterns) {
        if (check.pattern.test(match[0])) {
          violations.push(`${relativePath}: ${check.reason}`);
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("src/application usa helper compartilhado para resultados ok/fail", async () => {
  const files = await listApplicationSourceFiles(applicationDir);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");
    if (allowedManualResultFiles.has(relativePath)) continue;

    if (/return\s+\{\s*ok\s*:/m.test(source)) {
      violations.push(`${relativePath}: use ok(...) ou fail(...) de src/application/shared/result.js`);
    }
  }

  assert.deepEqual(violations, []);
});
