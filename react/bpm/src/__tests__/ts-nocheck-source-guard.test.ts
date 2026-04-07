/**
 * Source-Level @ts-nocheck Guard
 * Scans all .ts/.tsx source files for @ts-nocheck directives.
 * Enable after Phase 25 Wave 5 completes -- all @ts-nocheck removed.
 */
import * as fs from "fs";
import * as path from "path";

import { describe, test } from "vitest";

const SRC_DIR = path.resolve(__dirname, "..");

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      results.push(...findTsFiles(fullPath));
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// Phase 25 Wave 5 complete -- all @ts-nocheck removed
describe("Source-Level @ts-nocheck Guard", () => {
  test("no .ts/.tsx source files contain @ts-nocheck", () => {
    const files = findTsFiles(SRC_DIR);
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("@ts-nocheck")) {
        violations.push(path.relative(SRC_DIR, file));
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found @ts-nocheck in ${violations.length} source file(s):\n${violations.join("\n")}`,
      );
    }
  });
});
