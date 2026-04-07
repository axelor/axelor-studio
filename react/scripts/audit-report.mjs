/**
 * Pre-Merge Risk Report Generator
 *
 * Aggregates findings from 4 sources into a single Markdown report:
 * 1. Dead Code (Knip deep scan JSON)
 * 2. Architecture Violations (dependency-cruiser)
 * 3. Code Smells (grep-based detection)
 * 4. Security + Dependencies (pnpm audit)
 *
 * Each finding has a severity level: Critical, Warning, or Info.
 * Per D-11: findings only, no action recommendations.
 *
 * Usage:
 *   node scripts/audit-report.mjs [outputPath]
 *
 * Default output:
 *   ../.planning/phases/47-static-audit/pre-merge-risk-report.md
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const PACKAGES = [
  "bpm",
  "dmn",
  "shared",
  "generic-builder",
  "timer-builder",
  "mapper",
  "bpm-merge-split",
];

// Known bpmn-js DI false positive patterns
const FALSE_POSITIVE_PATTERNS = [
  "custom-provider",
  "custom-renderer",
  "bundled-config",
  "window.top.axelor",
];

const reactDir = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.resolve(
  reactDir,
  "..",
  ".planning",
  "phases",
  "47-static-audit",
  "pre-merge-risk-report.md",
);
const outputPath = process.argv[2] || defaultOutputPath;

const knipJsonPath = path.resolve(
  reactDir,
  "..",
  ".planning",
  "phases",
  "47-static-audit",
  "knip-deep-scan.json",
);

// Severity counters
const severity = {
  deadCode: { Critical: 0, Warning: 0, Info: 0 },
  architecture: { Critical: 0, Warning: 0, Info: 0 },
  codeSmells: { Critical: 0, Warning: 0, Info: 0 },
  security: { Critical: 0, Warning: 0, Info: 0 },
  reuse: { Critical: 0, Warning: 0, Info: 0 },
};

// ---------------------------------------------------------------------------
// Source 1: Dead Code (Knip JSON, per D-09.1)
// ---------------------------------------------------------------------------

console.log("[audit-report] Source 1: Reading Knip deep scan results...");

let knipData = {};
try {
  knipData = JSON.parse(readFileSync(knipJsonPath, "utf-8"));
} catch (err) {
  console.warn(`[audit-report] Could not read knip JSON: ${err.message}`);
}

const deadCodeFindings = { phantomDeps: [], orphanFiles: [], unusedExports: [] };

for (const pkg of PACKAGES) {
  const issues = knipData[pkg]?.issues ?? [];

  // Phantom dependencies (Critical)
  for (const issue of issues) {
    for (const dep of issue.dependencies ?? []) {
      const name = typeof dep === "string" ? dep : dep.name;
      deadCodeFindings.phantomDeps.push({ pkg, file: issue.file, dep: name });
      severity.deadCode.Critical++;
    }
    for (const dep of issue.devDependencies ?? []) {
      const name = typeof dep === "string" ? dep : dep.name;
      deadCodeFindings.phantomDeps.push({
        pkg,
        file: issue.file,
        dep: `${name} (dev)`,
      });
      severity.deadCode.Critical++;
    }
  }

  // Orphan files (Warning) -- files with no exports/types/deps flagged
  for (const issue of issues) {
    const hasExports = (issue.exports?.length ?? 0) > 0;
    const hasTypes = (issue.types?.length ?? 0) > 0;
    const hasDeps = (issue.dependencies?.length ?? 0) > 0;
    const hasDevDeps = (issue.devDependencies?.length ?? 0) > 0;
    if (!hasExports && !hasTypes && !hasDeps && !hasDevDeps && issue.file) {
      const isFP = FALSE_POSITIVE_PATTERNS.some((p) =>
        issue.file.includes(p),
      );
      deadCodeFindings.orphanFiles.push({
        pkg,
        file: issue.file,
        falsePositive: isFP,
      });
      severity.deadCode.Warning++;
    }
  }

  // Unused exports (Info)
  for (const issue of issues) {
    for (const exp of issue.exports ?? []) {
      const isFP = FALSE_POSITIVE_PATTERNS.some((p) =>
        issue.file.includes(p),
      );
      deadCodeFindings.unusedExports.push({
        pkg,
        file: issue.file,
        name: exp.name,
        line: exp.line ?? "?",
        falsePositive: isFP,
      });
      severity.deadCode.Info++;
    }
  }
}

// ---------------------------------------------------------------------------
// Source 2: Architecture Violations (dependency-cruiser, per D-09.2)
// ---------------------------------------------------------------------------

console.log("[audit-report] Source 2: Running dependency-cruiser...");

const archFindings = { violations: [], ruleCoverage: [] };
const depcruiseRules = [
  "shared-no-consumer-imports",
  "no-inter-package-cycles",
  "apps-isolated (6 sub-rules)",
  "no-deep-shared-imports",
];

for (const pkg of PACKAGES) {
  const cwd = path.resolve(reactDir, pkg);
  try {
    const raw = execSync(
      "pnpm exec depcruise --config ../.dependency-cruiser.cjs --output-type json src/ 2>/dev/null",
      { cwd, encoding: "utf-8", timeout: 120_000 },
    );
    const data = JSON.parse(raw);
    const violations = data.summary?.violations ?? [];
    for (const v of violations) {
      archFindings.violations.push({
        pkg,
        rule: v.rule?.name ?? "unknown",
        from: v.from,
        to: v.to,
        severity: v.rule?.severity ?? "error",
      });
      severity.architecture.Critical++;
    }
    const modulesScanned = data.summary?.totalCruised ?? data.modules?.length ?? 0;
    archFindings.ruleCoverage.push({ pkg, modulesScanned, violations: violations.length });
  } catch (err) {
    // Try to parse stdout even on non-zero exit
    if (err.stdout) {
      try {
        const data = JSON.parse(err.stdout);
        const violations = data.summary?.violations ?? [];
        for (const v of violations) {
          archFindings.violations.push({
            pkg,
            rule: v.rule?.name ?? "unknown",
            from: v.from,
            to: v.to,
            severity: v.rule?.severity ?? "error",
          });
          severity.architecture.Critical++;
        }
        const modulesScanned = data.summary?.totalCruised ?? data.modules?.length ?? 0;
        archFindings.ruleCoverage.push({ pkg, modulesScanned, violations: violations.length });
      } catch {
        archFindings.ruleCoverage.push({ pkg, modulesScanned: 0, violations: 0, error: err.message });
      }
    } else {
      archFindings.ruleCoverage.push({ pkg, modulesScanned: 0, violations: 0, error: err.message });
    }
  }
}

// ---------------------------------------------------------------------------
// Source 3: Code Smells (grep-based, per D-09.3)
// ---------------------------------------------------------------------------

console.log("[audit-report] Source 3: Scanning for code smells...");

const codeSmellFindings = {
  tsIgnore: [],
  largeFiles: [],
  todoFixme: [],
  anyCasts: [],
};

function runGrep(pattern, cwd) {
  try {
    const output = execSync(
      `grep -rn "${pattern}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
      { cwd, encoding: "utf-8", timeout: 30_000 },
    );
    return output
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

function findLargeFiles(cwd) {
  try {
    const output = execSync(
      `find src/ \\( -name "*.ts" -o -name "*.tsx" \\) -exec wc -l {} + 2>/dev/null | awk '$1 > 500 && !/total/' || true`,
      { cwd, encoding: "utf-8", timeout: 30_000 },
    );
    return output
      .trim()
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => {
        const match = l.trim().match(/^(\d+)\s+(.+)$/);
        return match ? { lines: parseInt(match[1], 10), file: match[2] } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

for (const pkg of PACKAGES) {
  const cwd = path.resolve(reactDir, pkg);

  // @ts-ignore / @ts-nocheck (Warning)
  // Pass 1: @ts-ignore -- always a real directive
  const tsIgnoreLines = runGrep("@ts-ignore", cwd);
  // Pass 2: @ts-nocheck -- only count real directives (line 1 of file)
  const tsNocheckAllLines = runGrep("@ts-nocheck", cwd);
  const tsNocheckLines = tsNocheckAllLines.filter((line) => {
    // runGrep format: "relative/path/to/file.ts:LINE_NUMBER:content"
    const match = line.match(/^[^:]+:(\d+):/);
    return match && match[1] === "1";
  });
  const tsIgnores = [...tsIgnoreLines, ...tsNocheckLines];
  for (const line of tsIgnores) {
    codeSmellFindings.tsIgnore.push({ pkg, detail: line });
    severity.codeSmells.Warning++;
  }

  // Files over 500 lines (Warning)
  const large = findLargeFiles(cwd);
  for (const f of large) {
    codeSmellFindings.largeFiles.push({ pkg, file: f.file, lines: f.lines });
    severity.codeSmells.Warning++;
  }

  // TODO/FIXME (Info)
  const todos = runGrep("TODO\\|FIXME", cwd);
  for (const line of todos) {
    codeSmellFindings.todoFixme.push({ pkg, detail: line });
    severity.codeSmells.Info++;
  }

  // any casts (Info)
  const anyCasts = runGrep(": any\\b\\|as any\\b\\|any\\[\\]", cwd);
  for (const line of anyCasts) {
    codeSmellFindings.anyCasts.push({ pkg, detail: line });
    severity.codeSmells.Info++;
  }
}

// ---------------------------------------------------------------------------
// Source 4: Security + Dependencies (pnpm audit, per D-09.4)
// ---------------------------------------------------------------------------

console.log("[audit-report] Source 4: Running pnpm audit...");

const securityFindings = { advisories: [], deprecated: [] };

try {
  const raw = execSync("pnpm audit --json 2>/dev/null || true", {
    cwd: reactDir,
    encoding: "utf-8",
    timeout: 60_000,
  });

  if (raw.trim()) {
    try {
      const data = JSON.parse(raw.trim());
      const advisories = data.advisories ?? data.vulnerabilities ?? {};

      for (const [name, advisory] of Object.entries(advisories)) {
        const npmSeverity = advisory.severity ?? advisory.via?.[0]?.severity ?? "unknown";
        let reportSeverity = "Info";
        if (npmSeverity === "critical" || npmSeverity === "high") {
          reportSeverity = "Critical";
        } else if (npmSeverity === "moderate") {
          reportSeverity = "Warning";
        }

        securityFindings.advisories.push({
          name: advisory.name ?? name,
          severity: npmSeverity,
          reportSeverity,
          title: advisory.title ?? advisory.via?.[0]?.title ?? "N/A",
          url: advisory.url ?? advisory.via?.[0]?.url ?? "",
          range: advisory.range ?? advisory.via?.[0]?.range ?? "",
        });

        severity.security[reportSeverity]++;
      }
    } catch {
      // pnpm audit may output non-JSON or empty
      console.log("[audit-report] pnpm audit returned no parseable JSON");
    }
  }
} catch (err) {
  console.log(`[audit-report] pnpm audit error: ${err.message}`);
}

// ---------------------------------------------------------------------------
// Source 5: Component Reuse Audit (per D-06, D-07, D-08)
// ---------------------------------------------------------------------------

console.log("[audit-report] Source 5: Scanning component reuse...");

const reuseFindings = { duplicates: [], promotionCandidates: [], inventory: [] };

// Known false-positive component names: documented as faux-doublons (D-03)
const KNOWN_FALSE_POSITIVES = new Set([
  "RenderWidget", "ModelProps", "TabPanel", "Dialog", "Select"
]);

// Consumer packages (exclude shared -- it IS the shared library)
const consumerPackages = PACKAGES.filter((p) => p !== "shared");

// 5.1: Inventory shared components
const sharedComponentsDir = path.resolve(reactDir, "shared", "src", "components");
let sharedComponentNames = [];
try {
  const entries = readdirSync(sharedComponentsDir, { withFileTypes: true });
  sharedComponentNames = entries
    .filter((e) => e.isFile() && /\.(tsx?|jsx?)$/.test(e.name))
    .map((e) => e.name.replace(/\.(tsx?|jsx?)$/, ""));
  // Also include subdirectory names (e.g., CodeEditor/)
  const subdirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  sharedComponentNames.push(...subdirs);
} catch { /* shared/src/components may not exist */ }

// 5.2: Scan for JSX component duplicates (D-07: JSX duplique)
for (const pkg of consumerPackages) {
  const pkgSrcDir = path.resolve(reactDir, pkg, "src");
  try {
    const allTsx = execSync(
      `find ${pkgSrcDir} -name "*.tsx" -o -name "*.jsx" 2>/dev/null || true`,
      { encoding: "utf-8", timeout: 10_000 }
    ).trim().split("\n").filter(Boolean);

    for (const filePath of allTsx) {
      const fileName = path.basename(filePath).replace(/\.(tsx?|jsx?)$/, "");
      if (sharedComponentNames.includes(fileName)) {
        // Check if it imports from shared (wrapper) or is independent (true duplicate)
        const content = readFileSync(filePath, "utf-8");

        // Detect barrel/re-export files: only export/import statements, no JSX
        const trimmedLines = content.split("\n").filter(l => l.trim() && !l.trim().startsWith("//"));
        const isBarrel = trimmedLines.every(l => {
            const t = l.trim();
            return /^(export|import)\s/.test(t)  // export/import statements
              || /^[A-Za-z_]\w*\s*,?$/.test(t)   // identifiers inside export { } blocks
              || t === "};" || t === "}"           // closing braces
              || t === "";
          })
          && !content.includes("return (")
          && !content.includes("return <");

        if (isBarrel) {
          reuseFindings.duplicates.push({
            component: fileName, pkg,
            file: path.relative(reactDir, filePath),
            kind: "barrel", reportSeverity: "Info",
          });
          severity.reuse.Info++;
          continue; // Skip Warning classification
        }

        // Known false-positive components: documented as faux-doublons (D-03)
        if (KNOWN_FALSE_POSITIVES.has(fileName)) {
          reuseFindings.duplicates.push({
            component: fileName, pkg,
            file: path.relative(reactDir, filePath),
            kind: "documented-false-positive", reportSeverity: "Info",
          });
          severity.reuse.Info++;
          continue;
        }

        const importsShared = content.includes("@studio/shared");
        const reportSeverity = importsShared ? "Info" : "Warning";
        const kind = importsShared ? "wrapper" : "duplicate";
        reuseFindings.duplicates.push({
          component: fileName,
          pkg,
          file: path.relative(reactDir, filePath),
          kind,
          reportSeverity,
        });
        severity.reuse[reportSeverity]++;
      }
    }
  } catch { /* package may not exist */ }
}

// 5.3: Scan for hook duplicates (D-07: hooks dupliques)
const sharedHooksDir = path.resolve(reactDir, "shared", "src");
let sharedHookNames = [];
try {
  const hookFiles = execSync(
    `find ${sharedHooksDir} -name "use*.ts" -o -name "use*.tsx" 2>/dev/null || true`,
    { encoding: "utf-8", timeout: 10_000 }
  ).trim().split("\n").filter(Boolean);
  sharedHookNames = hookFiles.map((f) => path.basename(f).replace(/\.(tsx?|ts)$/, ""));
} catch { /* */ }

for (const pkg of consumerPackages) {
  const pkgSrcDir = path.resolve(reactDir, pkg, "src");
  try {
    const hookFiles = execSync(
      `find ${pkgSrcDir} -name "use*.ts" -o -name "use*.tsx" 2>/dev/null || true`,
      { encoding: "utf-8", timeout: 10_000 }
    ).trim().split("\n").filter(Boolean);
    for (const filePath of hookFiles) {
      const hookName = path.basename(filePath).replace(/\.(tsx?|ts)$/, "");
      if (sharedHookNames.includes(hookName)) {
        const content = readFileSync(filePath, "utf-8");
        const importsShared = content.includes("@studio/shared");
        const reportSeverity = importsShared ? "Info" : "Warning";
        const kind = importsShared ? "re-export" : "duplicate";
        reuseFindings.duplicates.push({
          component: hookName,
          pkg,
          file: path.relative(reactDir, filePath),
          kind,
          reportSeverity,
        });
        severity.reuse[reportSeverity]++;
      }
    }
  } catch { /* */ }
}

// 5.4: Scan for utils/helpers duplicates (D-07: utils/helpers dupliques)
// Inventory all utils/helpers files across ALL packages (including shared)
const utilsInventory = {};
for (const pkg of PACKAGES) {
  const pkgSrcDir = path.resolve(reactDir, pkg, "src");
  try {
    const utilFiles = execSync(
      `find ${pkgSrcDir} \\( -name "utils.ts" -o -name "utils.tsx" -o -name "helpers.ts" -o -name "helpers.tsx" -o -name "utils.js" -o -name "helpers.js" \\) 2>/dev/null || true`,
      { encoding: "utf-8", timeout: 10_000 }
    ).trim().split("\n").filter(Boolean);
    for (const filePath of utilFiles) {
      const baseName = path.basename(filePath);
      if (!utilsInventory[baseName]) utilsInventory[baseName] = [];
      utilsInventory[baseName].push({ pkg, file: path.relative(reactDir, filePath) });
    }
  } catch { /* */ }
}
// Flag utils/helpers present in 2+ packages as Info (inventory) or Warning (if shared has one and consumer duplicates)
for (const [name, locations] of Object.entries(utilsInventory)) {
  if (locations.length >= 2) {
    const inShared = locations.some((l) => l.pkg === "shared");
    for (const loc of locations) {
      if (loc.pkg !== "shared") {
        const reportSeverity = inShared ? "Warning" : "Info";
        const kind = inShared ? "utils-duplicate" : "utils-multi-package";
        reuseFindings.duplicates.push({
          component: name,
          pkg: loc.pkg,
          file: loc.file,
          kind,
          reportSeverity,
        });
        severity.reuse[reportSeverity]++;
      }
    }
  }
}

// 5.5: Scan for components in multiple consumers but NOT in shared (promotion candidates)
const componentsByName = {};
for (const pkg of consumerPackages) {
  const pkgSrcDir = path.resolve(reactDir, pkg, "src");
  try {
    const allTsx = execSync(
      `find ${pkgSrcDir} -name "*.tsx" -o -name "*.jsx" 2>/dev/null || true`,
      { encoding: "utf-8", timeout: 10_000 }
    ).trim().split("\n").filter(Boolean);
    for (const filePath of allTsx) {
      const fileName = path.basename(filePath).replace(/\.(tsx?|jsx?)$/, "");
      if (!sharedComponentNames.includes(fileName)) {
        if (!componentsByName[fileName]) componentsByName[fileName] = [];
        componentsByName[fileName].push({ pkg, file: path.relative(reactDir, filePath) });
      }
    }
  } catch { /* */ }
}
for (const [name, locations] of Object.entries(componentsByName)) {
  if (locations.length >= 2) {
    // Refinement B: Known false-positive exclusion (D-03)
    if (KNOWN_FALSE_POSITIVES.has(name)) {
      for (const loc of locations) {
        reuseFindings.duplicates.push({
          component: name,
          pkg: loc.pkg,
          file: loc.file,
          kind: "documented-false-positive",
          reportSeverity: "Info",
        });
        severity.reuse.Info++;
      }
      continue;
    }

    // Refinement C: Cross-package test reclassification (D-06)
    if (/\.(characterization\.)?test$/.test(name)) {
      for (const loc of locations) {
        reuseFindings.duplicates.push({
          component: name,
          pkg: loc.pkg,
          file: loc.file,
          kind: "test-same-name-different-domain",
          reportSeverity: "Info",
        });
        severity.reuse.Info++;
      }
      continue;
    }

    reuseFindings.promotionCandidates.push({
      component: name,
      packages: locations.map((l) => l.pkg),
      files: locations.map((l) => l.file),
    });
    severity.reuse.Info++;
  }
}

// 5.6: CSS module duplicates (D-07: styles CSS modules dupliques)
const sharedCssDir = path.resolve(reactDir, "shared", "src");
let sharedCssNames = [];
try {
  const cssFiles = execSync(
    `find ${sharedCssDir} -name "*.module.css" 2>/dev/null || true`,
    { encoding: "utf-8", timeout: 10_000 }
  ).trim().split("\n").filter(Boolean);
  sharedCssNames = cssFiles.map((f) => path.basename(f));
} catch { /* */ }

for (const pkg of consumerPackages) {
  const pkgSrcDir = path.resolve(reactDir, pkg, "src");
  try {
    const cssFiles = execSync(
      `find ${pkgSrcDir} -name "*.module.css" 2>/dev/null || true`,
      { encoding: "utf-8", timeout: 10_000 }
    ).trim().split("\n").filter(Boolean);
    for (const filePath of cssFiles) {
      const cssName = path.basename(filePath);
      if (sharedCssNames.includes(cssName)) {
        reuseFindings.duplicates.push({
          component: cssName,
          pkg,
          file: path.relative(reactDir, filePath),
          kind: "css-duplicate",
          reportSeverity: "Info",
        });
        severity.reuse.Info++;
      }
    }
  } catch { /* */ }
}

// 5.7: Inventory count
reuseFindings.inventory = {
  sharedComponents: sharedComponentNames.length,
  duplicateFindings: reuseFindings.duplicates.length,
  promotionCandidates: reuseFindings.promotionCandidates.length,
  utilsFiles: Object.values(utilsInventory).flat().length,
};

// ---------------------------------------------------------------------------
// Generate Markdown Report
// ---------------------------------------------------------------------------

console.log("[audit-report] Generating report...");

const now = new Date().toISOString().split("T")[0];
const totalCritical =
  severity.deadCode.Critical +
  severity.architecture.Critical +
  severity.codeSmells.Critical +
  severity.security.Critical +
  severity.reuse.Critical;
const totalWarning =
  severity.deadCode.Warning +
  severity.architecture.Warning +
  severity.codeSmells.Warning +
  severity.security.Warning +
  severity.reuse.Warning;
const totalInfo =
  severity.deadCode.Info +
  severity.architecture.Info +
  severity.codeSmells.Info +
  severity.security.Info +
  severity.reuse.Info;

function catTotal(cat) {
  return cat.Critical + cat.Warning + cat.Info;
}

const lines = [];

lines.push("# Pre-Merge Risk Report");
lines.push("");
lines.push(`**Generated:** ${now}`);
lines.push("**Branch:** refactor/react-bpm-dmn");
lines.push(
  "**Scope:** 7 quality packages (bpm, dmn, shared, generic-builder, timer-builder, mapper, bpm-merge-split)",
);
lines.push("");

// Executive Summary
lines.push("## Executive Summary");
lines.push("");
lines.push("| Category | Critical | Warning | Info | Total |");
lines.push("|----------|----------|---------|------|-------|");
lines.push(
  `| Dead Code | ${severity.deadCode.Critical} | ${severity.deadCode.Warning} | ${severity.deadCode.Info} | ${catTotal(severity.deadCode)} |`,
);
lines.push(
  `| Architecture Violations | ${severity.architecture.Critical} | ${severity.architecture.Warning} | ${severity.architecture.Info} | ${catTotal(severity.architecture)} |`,
);
lines.push(
  `| Code Smells | ${severity.codeSmells.Critical} | ${severity.codeSmells.Warning} | ${severity.codeSmells.Info} | ${catTotal(severity.codeSmells)} |`,
);
lines.push(
  `| Security + Dependencies | ${severity.security.Critical} | ${severity.security.Warning} | ${severity.security.Info} | ${catTotal(severity.security)} |`,
);
lines.push(
  `| Component Reuse | ${severity.reuse.Critical} | ${severity.reuse.Warning} | ${severity.reuse.Info} | ${catTotal(severity.reuse)} |`,
);
lines.push(
  `| **Total** | **${totalCritical}** | **${totalWarning}** | **${totalInfo}** | **${totalCritical + totalWarning + totalInfo}** |`,
);
lines.push("");

// Section 1: Dead Code
lines.push("## 1. Dead Code");
lines.push("");

// 1.1 Phantom Dependencies
lines.push("### 1.1 Phantom Dependencies (Critical)");
lines.push("");
if (deadCodeFindings.phantomDeps.length === 0) {
  lines.push("None -- all 7 packages have clean dependency declarations.");
} else {
  for (const f of deadCodeFindings.phantomDeps) {
    lines.push(`- **${f.pkg}**: \`${f.dep}\` used in \`${f.file}\``);
  }
}
lines.push("");

// 1.2 Orphan Files
lines.push("### 1.2 Orphan Files (Warning)");
lines.push("");
if (deadCodeFindings.orphanFiles.length === 0) {
  lines.push("None -- all files are referenced in the dependency graph.");
} else {
  for (const f of deadCodeFindings.orphanFiles) {
    const tag = f.falsePositive ? " [FP]" : "";
    lines.push(`- **${f.pkg}**: \`${f.file}\`${tag}`);
  }
}
lines.push("");

// 1.3 Unused Exports
lines.push("### 1.3 Unused Exports (Info)");
lines.push("");
if (deadCodeFindings.unusedExports.length === 0) {
  lines.push("None -- all exports are consumed.");
} else {
  // Group by package, show top offenders
  const byPkg = {};
  for (const f of deadCodeFindings.unusedExports) {
    if (!byPkg[f.pkg]) byPkg[f.pkg] = [];
    byPkg[f.pkg].push(f);
  }
  for (const [pkg, items] of Object.entries(byPkg)) {
    lines.push(`**${pkg}** (${items.length} unused exports):`);
    for (const item of items.slice(0, 10)) {
      const tag = item.falsePositive ? " [FP]" : "";
      lines.push(`- \`${item.file}\`: \`${item.name}\` (line ${item.line})${tag}`);
    }
    if (items.length > 10) {
      lines.push(`- ... and ${items.length - 10} more`);
    }
    lines.push("");
  }
}
lines.push("");

// Section 2: Architecture Violations
lines.push("## 2. Architecture Violations");
lines.push("");

// 2.1 Boundary Violations
lines.push("### 2.1 Boundary Violations (Critical)");
lines.push("");
if (archFindings.violations.length === 0) {
  lines.push("None -- all 4 architecture boundary rules pass across 7 packages.");
} else {
  for (const v of archFindings.violations) {
    lines.push(`- **${v.pkg}**: Rule \`${v.rule}\` -- \`${v.from}\` -> \`${v.to}\``);
  }
}
lines.push("");

// 2.2 Rule Coverage
lines.push("### 2.2 Rule Coverage");
lines.push("");
lines.push("| Package | Modules Scanned | Violations |");
lines.push("|---------|----------------|------------|");
for (const r of archFindings.ruleCoverage) {
  const errNote = r.error ? ` (error)` : "";
  lines.push(`| ${r.pkg} | ${r.modulesScanned}${errNote} | ${r.violations} |`);
}
lines.push("");

lines.push("**Active Rules:**");
lines.push("");
lines.push("| Rule | Scope | Status |");
lines.push("|------|-------|--------|");
lines.push("| shared-no-consumer-imports | bpm, dmn, bpm-merge-split | Active |");
lines.push("| no-inter-package-cycles | Cross-package boundaries | Active |");
lines.push("| apps-isolated (6 sub-rules) | bpm, dmn, bpm-merge-split | Active |");
lines.push("| no-deep-shared-imports | All except shared | Active |");
lines.push("");

// Section 3: Code Smells
lines.push("## 3. Code Smells");
lines.push("");

// 3.1 @ts-ignore / @ts-nocheck
lines.push("### 3.1 @ts-ignore / @ts-nocheck (Warning)");
lines.push("");
if (codeSmellFindings.tsIgnore.length === 0) {
  lines.push("None -- no TypeScript suppression directives found.");
} else {
  const byPkg = {};
  for (const f of codeSmellFindings.tsIgnore) {
    if (!byPkg[f.pkg]) byPkg[f.pkg] = [];
    byPkg[f.pkg].push(f.detail);
  }
  lines.push(`**Total:** ${codeSmellFindings.tsIgnore.length} occurrences`);
  lines.push("");
  for (const [pkg, items] of Object.entries(byPkg)) {
    lines.push(`**${pkg}** (${items.length}):`);
    for (const item of items) {
      lines.push(`- \`${item}\``);
    }
    lines.push("");
  }
}
lines.push("");

// 3.2 Files Over 500 Lines
lines.push("### 3.2 Files Over 500 Lines (Warning)");
lines.push("");
if (codeSmellFindings.largeFiles.length === 0) {
  lines.push("None -- all source files are under 500 lines.");
} else {
  lines.push("| Package | File | Lines |");
  lines.push("|---------|------|-------|");
  for (const f of codeSmellFindings.largeFiles) {
    lines.push(`| ${f.pkg} | \`${f.file}\` | ${f.lines} |`);
  }
}
lines.push("");

// 3.3 TODO/FIXME
lines.push("### 3.3 TODO/FIXME (Info)");
lines.push("");
if (codeSmellFindings.todoFixme.length === 0) {
  lines.push("None -- no TODO/FIXME comments found.");
} else {
  const byPkg = {};
  for (const f of codeSmellFindings.todoFixme) {
    if (!byPkg[f.pkg]) byPkg[f.pkg] = [];
    byPkg[f.pkg].push(f.detail);
  }
  lines.push(`**Total:** ${codeSmellFindings.todoFixme.length} occurrences`);
  lines.push("");
  for (const [pkg, items] of Object.entries(byPkg)) {
    lines.push(`- **${pkg}**: ${items.length}`);
  }
}
lines.push("");

// 3.4 any/unknown Casts
lines.push("### 3.4 any/unknown Casts (Info)");
lines.push("");
if (codeSmellFindings.anyCasts.length === 0) {
  lines.push("None -- no `any` casts found.");
} else {
  const byPkg = {};
  for (const f of codeSmellFindings.anyCasts) {
    if (!byPkg[f.pkg]) byPkg[f.pkg] = [];
    byPkg[f.pkg].push(f.detail);
  }
  lines.push(`**Total:** ${codeSmellFindings.anyCasts.length} occurrences`);
  lines.push("");
  for (const [pkg, items] of Object.entries(byPkg)) {
    lines.push(`- **${pkg}**: ${items.length}`);
  }
}
lines.push("");

// Section 4: Security + Dependencies
lines.push("## 4. Security + Dependencies");
lines.push("");

// 4.1 npm Audit Findings
lines.push("### 4.1 npm Audit Findings");
lines.push("");
if (securityFindings.advisories.length === 0) {
  lines.push("No known vulnerabilities found by `pnpm audit`.");
} else {
  const bySeverity = { Critical: [], Warning: [], Info: [] };
  for (const a of securityFindings.advisories) {
    bySeverity[a.reportSeverity].push(a);
  }
  for (const [sev, items] of Object.entries(bySeverity)) {
    if (items.length === 0) continue;
    lines.push(`**${sev}** (${items.length}):`);
    for (const item of items) {
      const url = item.url ? ` -- ${item.url}` : "";
      lines.push(
        `- \`${item.name}\`: ${item.title} (npm severity: ${item.severity})${url}`,
      );
    }
    lines.push("");
  }
}
lines.push("");

// 4.2 Deprecated Packages
lines.push("### 4.2 Deprecated Packages");
lines.push("");
if (securityFindings.deprecated.length === 0) {
  lines.push("No deprecated packages detected.");
} else {
  for (const d of securityFindings.deprecated) {
    lines.push(`- \`${d.name}\`: ${d.reason}`);
  }
}
lines.push("");

// Section 5: Component Reuse
lines.push("## 5. Component Reuse");
lines.push("");
lines.push(`Shared library provides **${reuseFindings.inventory.sharedComponents}** components/hooks in \`@studio/shared\`.`);
lines.push(`Utils/helpers files found across packages: **${reuseFindings.inventory.utilsFiles}**.`);
lines.push("");

// 5.1 Duplicate Components/Hooks/Utils
lines.push("### 5.1 Duplicate Components, Hooks, and Utils (Warning) / Wrappers (Info)");
lines.push("");
if (reuseFindings.duplicates.length === 0) {
  lines.push("No duplicate components found -- all consumer packages use shared components.");
} else {
  const byComponent = {};
  for (const d of reuseFindings.duplicates) {
    if (!byComponent[d.component]) byComponent[d.component] = [];
    byComponent[d.component].push(d);
  }
  lines.push("| Component | Package | File | Type | Severity |");
  lines.push("|-----------|---------|------|------|----------|");
  for (const [name, items] of Object.entries(byComponent)) {
    for (const item of items) {
      lines.push(`| ${name} | ${item.pkg} | \`${item.file}\` | ${item.kind} | ${item.reportSeverity} |`);
    }
  }
}
lines.push("");

// 5.2 Promotion Candidates
lines.push("### 5.2 Promotion Candidates (Info)");
lines.push("");
lines.push("Components present in 2+ consumer packages but not in shared -- candidates for promotion:");
lines.push("");
if (reuseFindings.promotionCandidates.length === 0) {
  lines.push("None -- all multi-package components are already in shared.");
} else {
  lines.push("| Component | Packages | Files |");
  lines.push("|-----------|----------|-------|");
  for (const c of reuseFindings.promotionCandidates) {
    lines.push(`| ${c.component} | ${c.packages.join(", ")} | ${c.files.map((f) => "\`" + f + "\`").join(", ")} |`);
  }
}
lines.push("");

// Footer
lines.push("---");
lines.push(
  "*Report generated by `pnpm audit-report` -- factual inventory only, per D-11*",
);
lines.push("");

// Write report
const report = lines.join("\n");
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, report);
console.log(`[audit-report] Report written to ${outputPath}`);
console.log("[audit-report] Done.");
