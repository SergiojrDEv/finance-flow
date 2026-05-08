import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceDir = path.join(rootDir, "src");

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (entry.isFile() && [".js", ".ts"].includes(path.extname(entry.name))) return [fullPath];
    return [];
  }));
  return files.flat();
}

test("frontend nao carrega fallback fixo de Supabase no bundle", async () => {
  const files = await listSourceFiles(sourceDir);
  const forbiddenPatterns = [
    /SUPABASE_FALLBACK_CONFIG/,
    /sb_publishable_/,
    /https:\/\/[a-z0-9-]+\.supabase\.co/i,
  ];
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(source)) {
        violations.push(relativePath);
        break;
      }
    }
  }

  assert.deepEqual(violations, []);
});
