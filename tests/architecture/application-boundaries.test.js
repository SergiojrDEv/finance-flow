import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { typeScriptPrimarySourceFiles } from "../../scripts/typescript-primary-sources.mjs";

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
  "src/application/shared/result.ts",
]);

const typeScriptPrimarySourceFileSet = new Set(typeScriptPrimarySourceFiles);

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

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

test("src/application mantem contraparte JavaScript durante migracao TypeScript", async () => {
  const files = await listApplicationSourceFiles(applicationDir);
  const typeScriptFiles = files.filter((filePath) => path.extname(filePath) === ".ts");
  const violations = [];

  for (const filePath of typeScriptFiles) {
    const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");
    if (typeScriptPrimarySourceFileSet.has(relativePath)) continue;

    const javascriptPath = filePath.replace(/\.ts$/, ".js");
    if (!(await exists(javascriptPath))) {
      violations.push(`${relativePath}: mantenha a contraparte .js ate este modulo virar fonte principal no build`);
    }
  }

  assert.deepEqual(violations, []);
});

test("fontes TypeScript principais existem em camadas permitidas", async () => {
  const violations = [];
  const allowedPrefixes = ["src/application/", "src/domain/", "src/infrastructure/"];

  for (const relativePath of typeScriptPrimarySourceFiles) {
    const fullPath = path.join(rootDir, relativePath);
    if (!allowedPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
      violations.push(`${relativePath}: fonte TypeScript principal deve ficar em src/application, src/domain ou src/infrastructure nesta fase`);
      continue;
    }

    if (path.extname(relativePath) !== ".ts") {
      violations.push(`${relativePath}: fonte TypeScript principal deve usar extensao .ts`);
      continue;
    }

    if (!(await exists(fullPath))) {
      violations.push(`${relativePath}: fonte TypeScript principal nao existe`);
    }

    const javascriptPath = fullPath.replace(/\.ts$/, ".js");
    if (!(await exists(javascriptPath))) {
      violations.push(`${relativePath}: mantenha a ponte .js ate os imports do runtime apontarem para dist transpilado`);
    }
  }

  assert.deepEqual(violations, []);
});

test("ports de aplicacao nao retornam Promise<unknown>", async () => {
  const files = await listApplicationSourceFiles(applicationDir);
  const violations = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");
    if (!relativePath.includes("/ports/") || path.extname(relativePath) !== ".ts") continue;

    const source = await readFile(filePath, "utf8");
    if (/Promise<unknown>/.test(source)) {
      violations.push(`${relativePath}: use um contrato tipado no retorno do port`);
    }
  }

  assert.deepEqual(violations, []);
});
