import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(resolved) : resolved;
    }),
  );

  return files.flat();
}

for (const filename of await walk(sourceRoot)) {
  if (!/\.[cm]?[jt]sx?$/.test(filename)) continue;

  const relative = path.relative(root, filename);
  const source = await readFile(filename, "utf8");
  const importsLightweight = /["']lightweight-charts["']/.test(source);
  const importsVisx = /["']@visx\//.test(source);
  const isLightweightLeaf = relative.startsWith("src/lib/charts/lightweight/");
  const isVisxLeaf = relative.startsWith("src/lib/charts/visx/");

  if (importsLightweight && !isLightweightLeaf) {
    violations.push(`${relative}: Lightweight Charts import is outside its leaf boundary`);
  }

  if (importsVisx && !isVisxLeaf) {
    violations.push(`${relative}: Visx import is outside its leaf boundary`);
  }

  if (importsLightweight && importsVisx) {
    violations.push(`${relative}: one module imports both chart engines`);
  }

  if (source.includes("@visx/visx")) {
    violations.push(`${relative}: umbrella Visx imports are forbidden`);
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Chart engine boundaries are valid.");
