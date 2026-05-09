import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const serviceWorkerPath = path.join(rootDir, "sw.js");

test("service worker nao cacheia configuracao publica do Supabase", async () => {
  const source = await readFile(serviceWorkerPath, "utf8");
  const requiredSnippets = [
    'url.pathname === "/api/config"',
    'fetch(event.request, { cache: "no-store" })',
  ];
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

  assert.deepEqual(missing, []);
});
