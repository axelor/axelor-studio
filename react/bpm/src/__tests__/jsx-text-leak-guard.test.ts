/**
 * JSX Text Leak Guard for BPM
 * Detects // comments as direct JSX children that render as visible text.
 */
import * as fs from "fs";
import * as path from "path";

import { describe, it, expect } from "vitest";

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      results.push(...findTsxFiles(fullPath));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

function detectJsxTextLeaks(srcDir: string) {
  const leaks: Array<{ file: string; line: number; comment: string }> = [];
  const files = findTsxFiles(srcDir);
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].trim();
      if (!stripped.startsWith("//")) continue;
      if (i === 0 && stripped.includes("@ts-nocheck")) continue;
      let prevLine = "";
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const p = lines[j].trim();
        if (p) {
          prevLine = p;
          break;
        }
      }
      let nextLine = "";
      for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
        const n = lines[j].trim();
        if (n) {
          nextLine = n;
          break;
        }
      }
      if (prevLine.endsWith(">") && (nextLine.startsWith("<") || nextLine.startsWith("{"))) {
        leaks.push({
          file: path.relative(srcDir, file),
          line: i + 1,
          comment: stripped.substring(0, 80),
        });
      }
    }
  }
  return leaks;
}

describe("JSX Text Leak Guard", () => {
  it("no // comments as direct JSX children in bpm/src", () => {
    const srcDir = path.resolve(__dirname, "..");
    const leaks = detectJsxTextLeaks(srcDir);
    if (leaks.length > 0) {
      const report = leaks.map((l) => `  ${l.file}:${l.line} — ${l.comment}`).join("\n");
      expect.fail(`${leaks.length} // comments will render as visible text:\n${report}`);
    }
  });
});
