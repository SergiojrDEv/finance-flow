import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  }));
  return files.flat();
}

async function transpileTypeScriptSources() {
  let ts;
  try {
    ts = await import("typescript");
  } catch {
    return false;
  }

  const sourceDir = path.join(root, "src");
  const files = await listFiles(sourceDir);
  const tsFiles = files.filter((file) => file.endsWith(".ts"));

  await Promise.all(tsFiles.map(async (sourcePath) => {
    const source = await readFile(sourcePath, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        sourceMap: false,
      },
      fileName: sourcePath,
    });
    const relativePath = path.relative(sourceDir, sourcePath).replace(/\.ts$/, ".js");
    const outputPath = path.join(dist, "src", relativePath);
    await writeFile(outputPath, output.outputText);
  }));

  return tsFiles.length > 0;
}

const didTranspileTypeScript = await transpileTypeScriptSources();
const output = await stat(dist);

if (!output.isDirectory()) {
  throw new Error("Build estatico nao gerou a pasta dist.");
}

console.log(`Static build ready at dist/${didTranspileTypeScript ? " with TypeScript transpilation" : ""}`);
