/**
 * JSX Text Leak Guard
 *
 * Detects // comments placed as direct children of JSX elements.
 * In JSX, // line-comments between tags render as visible text in the browser.
 * This test catches the issue at build time.
 *
 * Origin: Phase 20 migration where @ts-expect-error comments leaked into the UI.
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
  const leaks: Array<{
    file: string;
    line: number;
    comment: string;
    prevLine: string;
    nextLine: string;
  }> = [];
  const files = findTsxFiles(srcDir);
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
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
          prevLine: prevLine.substring(Math.max(0, prevLine.length - 50)),
          nextLine: nextLine.substring(0, 50),
        });
      }
    }
  }
  return leaks;
}

describe("JSX Text Leak Guard", () => {
  it("no // comments as direct JSX children in shared/src", () => {
    const srcDir = path.resolve(__dirname, "..");
    const leaks = detectJsxTextLeaks(srcDir);
    if (leaks.length > 0) {
      const report = leaks
        .map(
          (l) =>
            `  ${l.file}:${l.line}\n    ${l.comment}\n    prev: ${l.prevLine}\n    next: ${l.nextLine}`,
        )
        .join("\n\n");
      expect.fail(
        `${leaks.length} // comments will render as visible text:\n\n${report}\n\nFix: remove, use {/* */}, or wrap in {}`,
      );
    }
  });
});
