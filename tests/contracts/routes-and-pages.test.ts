import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const sourceRoot = join(process.cwd(), "src");

function findFiles(directory: string, predicate: (file: string) => boolean): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...findFiles(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

const apiRoutes = findFiles(join(sourceRoot, "app", "api"), (file) => file.endsWith("route.ts"));
const pages = findFiles(join(sourceRoot, "app"), (file) => file.endsWith("page.tsx"));

const directHandlerPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
const aliasedHandlerPattern = /export\s*\{[^}]*\bas\s+(GET|POST|PUT|PATCH|DELETE)\b[^}]*\}/g;

test("every API route exports at least one HTTP handler", () => {
  assert.ok(apiRoutes.length > 0);
  for (const file of apiRoutes) {
    const source = readFileSync(file, "utf8");
    const handlers = [
      ...[...source.matchAll(directHandlerPattern)].map((match) => match[1]),
      ...[...source.matchAll(aliasedHandlerPattern)].map((match) => match[1]),
    ];
    assert.ok(handlers.length > 0, `${relative(process.cwd(), file)} has no HTTP handler`);
    assert.equal(new Set(handlers).size, handlers.length, `${relative(process.cwd(), file)} duplicates a handler`);
  }
});

test("every page entry point has a default component export", () => {
  assert.ok(pages.length > 0);
  for (const file of pages) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /export\s+default\s+(?:async\s+)?function\s+\w+/, `${relative(process.cwd(), file)} has no default page component`);
  }
});

test("dynamic tenant pages use async route params", () => {
  const tenantRoot = join(sourceRoot, "app", "[university]", "[program]", "[class]");
  const tenantPages = findFiles(tenantRoot, (file) => file.endsWith("page.tsx") || file.endsWith("layout.tsx"));

  for (const file of tenantPages) {
    const source = readFileSync(file, "utf8");
    if (/params\b/.test(source)) {
      assert.match(source, /params\s*:\s*Promise</, `${relative(process.cwd(), file)} must type Next route params as Promise`);
    }
  }
});

test("tenant navigation source does not build paths from unresolved params", () => {
  const tenantSource = readFileSync(join(sourceRoot, "components", "layout", "TenantNavbar.tsx"), "utf8");
  const dynamicPages = findFiles(join(sourceRoot, "app", "[university]", "[program]", "[class]"), (file) => file.endsWith("page.tsx"));

  assert.doesNotMatch(tenantSource, /undefined\/undefined/);
  for (const file of dynamicPages) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /`\/\$\{params\./, `${relative(process.cwd(), file)} interpolates unresolved params`);
  }
});