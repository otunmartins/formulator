// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Guard tests (CODING_STANDARDS §11): fail the build if a product or data-seam rule is broken.

const ROOT = process.cwd();

function sourceFiles(dir: string): string[] {
  const abs = join(ROOT, dir);
  return readdirSync(abs).flatMap((name) => {
    const path = join(abs, name);
    if (statSync(path).isDirectory()) return sourceFiles(relative(ROOT, path));
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const rel = (path: string) => relative(ROOT, path).split(sep).join("/");
const APP_SOURCES = ["app", "components", "lib"].flatMap(sourceFiles);
const read = (path: string) => readFileSync(path, "utf8");

describe("product rules", () => {
  it('never uses the word "safe" in app source (verdicts, copy or labels)', () => {
    const offenders = APP_SOURCES.filter((f) => /\bsafe\b/i.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  it("has no overall or safety score", () => {
    const offenders = APP_SOURCES.filter((f) =>
      /\b(overall|safety|total)[ _-]?score\b/i.test(read(f).replace(/No overall score/g, "")),
    ).map(rel);
    expect(offenders).toEqual([]);
  });
});

describe("data seam", () => {
  it("only lib/data imports lib/mocks or Prisma", () => {
    const offenders = APP_SOURCES.filter((f) => !rel(f).startsWith("lib/data/"))
      .filter((f) => !rel(f).startsWith("lib/mocks/"))
      .filter((f) => /from\s+["'](@\/lib\/mocks|[./]*lib\/mocks|@prisma\/client)/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("only lib/data reads USE_MOCKS", () => {
    const offenders = APP_SOURCES.filter((f) => !rel(f).startsWith("lib/data/"))
      .filter((f) => read(f).includes("USE_MOCKS"))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  const dataFiles = sourceFiles("lib/data");

  it("every lib/data module is server-only", () => {
    const offenders = dataFiles
      .filter((f) => !read(f).trimStart().startsWith('import "server-only"'))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("no lib/data function takes a user, owner or workspace ID", () => {
    const offenders: string[] = [];
    for (const file of dataFiles) {
      for (const match of read(file).matchAll(
        /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
      )) {
        if (/\b(userId|ownerId|workspaceId)\b/.test(match[2] ?? "")) {
          offenders.push(`${rel(file)}: ${match[1]}`);
        }
      }
    }
    expect(dataFiles.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});
