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

test("styles mantem cards discretos e sem letter spacing negativo", async () => {
  const source = await readFile(stylesPath, "utf8");

  assert.equal(/border-radius:\s*(10|11|12|13|14|15|16)px/.test(source), false);
  assert.equal(/letter-spacing:\s*-/.test(source), false);
});
