import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("wrangler preserva variaveis configuradas no painel durante deploy", async () => {
  const source = await readFile(path.join(rootDir, "wrangler.jsonc"), "utf8");
  const config = JSON.parse(source);

  assert.equal(config.keep_vars, true);
});
