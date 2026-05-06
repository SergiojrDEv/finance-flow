import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const entries = [
  "index.html",
  "sw.js",
  "manifest.webmanifest",
  "app-icon.svg",
  "src",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  await cp(path.join(root, entry), path.join(dist, entry), { recursive: true });
}

const output = await stat(dist);

if (!output.isDirectory()) {
  throw new Error("Build estatico nao gerou a pasta dist.");
}

console.log("Static build ready at dist/");
