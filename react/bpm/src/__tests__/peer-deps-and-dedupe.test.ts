/**
 * BASE-03: peerDependencies + resolve.dedupe invariant tests
 *
 * Verifies that:
 *  1. All 4 satellite apps declare react and react-dom in peerDependencies
 *     (not in dependencies) to prevent duplicate React instances when linked
 *     into bpm via pnpm link:.
 *  2. All 5 vite.config.js files include resolve.dedupe: ['react', 'react-dom']
 *     so Vite de-duplicates React across the linked bundle.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { describe, it, expect } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Root of the react/ workspace — 3 levels up from src/__tests__/:
// __tests__/ -> src/ -> bpm/ -> react/
const REACT_ROOT = resolve(__dirname, "../../..");

const SATELLITE_APPS = ["generic-builder", "mapper", "timer-builder", "bpm-merge-split"];

const ALL_APPS = [...SATELLITE_APPS, "bpm"];

interface PackageJson {
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

function readJSON(filePath: string): PackageJson {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function readText(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

// ---------------------------------------------------------------------------
// package.json peerDependencies checks (satellites only)
// ---------------------------------------------------------------------------

describe("BASE-03 — satellite apps declare react/react-dom as peerDependencies", () => {
  SATELLITE_APPS.forEach((app) => {
    const pkgPath = resolve(REACT_ROOT, app, "package.json");

    it(`${app}: react is declared in peerDependencies`, () => {
      const pkg = readJSON(pkgPath);
      expect(
        pkg.peerDependencies!,
        `${app}/package.json must have a peerDependencies section`,
      ).toBeDefined();
      expect(
        pkg.peerDependencies!.react,
        `${app}/package.json peerDependencies must include react`,
      ).toBeDefined();
    });

    it(`${app}: react-dom is declared in peerDependencies`, () => {
      const pkg = readJSON(pkgPath);
      expect(
        pkg.peerDependencies!,
        `${app}/package.json must have a peerDependencies section`,
      ).toBeDefined();
      expect(
        pkg.peerDependencies!["react-dom"],
        `${app}/package.json peerDependencies must include react-dom`,
      ).toBeDefined();
    });

    it(`${app}: react is NOT in dependencies (only in peerDependencies)`, () => {
      const pkg = readJSON(pkgPath);
      expect(
        pkg.dependencies?.react,
        `${app}/package.json must NOT have react in dependencies (it belongs in peerDependencies)`,
      ).toBeUndefined();
    });

    it(`${app}: react-dom is NOT in dependencies (only in peerDependencies)`, () => {
      const pkg = readJSON(pkgPath);
      expect(
        pkg.dependencies?.["react-dom"],
        `${app}/package.json must NOT have react-dom in dependencies (it belongs in peerDependencies)`,
      ).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// vite.config.js resolve.dedupe checks (all 5 apps)
// ---------------------------------------------------------------------------

describe("BASE-03 — all vite.config.js files have resolve.dedupe for react and react-dom", () => {
  ALL_APPS.forEach((app) => {
    const vitePath = resolve(REACT_ROOT, app, "vite.config.js");

    it(`${app}/vite.config.js contains dedupe entry for 'react'`, () => {
      const source = readText(vitePath);
      // The dedupe array must include the string 'react' (also matches 'react-dom',
      // so we look for the standalone token surrounded by quotes and optional whitespace)
      expect(source, `${app}/vite.config.js must have resolve.dedupe containing 'react'`).toMatch(
        /'react'/,
      );
    });

    it(`${app}/vite.config.js contains dedupe entry for 'react-dom'`, () => {
      const source = readText(vitePath);
      expect(
        source,
        `${app}/vite.config.js must have resolve.dedupe containing 'react-dom'`,
      ).toMatch(/'react-dom'/);
    });

    it(`${app}/vite.config.js has a dedupe array inside a resolve block`, () => {
      const source = readText(vitePath);
      expect(source, `${app}/vite.config.js must have a resolve block with dedupe`).toMatch(
        /resolve\s*:\s*\{[^}]*dedupe/s,
      );
    });
  });
});
