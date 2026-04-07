/**
 * Initialization Optimization Guard Tests
 *
 * Structural tests that prevent regression of the init-time optimizations
 * that reduce flickering when opening the BPM viewer ("Voir processus").
 *
 * These tests verify:
 * 1. getInfo() uses promise-deduplication (no duplicate network calls)
 * 2. App.tsx resolves mode synchronously (no useEffect for URL parsing)
 * 3. StoreProvider parallelizes init fetches
 * 4. useAppTheme uses single setState (no intermediate loading states)
 */
import fs from "fs";
import path from "path";

import { describe, it, expect } from "vitest";

function readSrc(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "..", relativePath), "utf-8");
}

function readShared(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, "..", "..", "..", "shared", "src", relativePath),
    "utf-8",
  );
}

// ===========================================================================
// Guard: getInfo() promise deduplication
// ===========================================================================
describe("getInfo() — promise deduplication cache", () => {
  const src = readShared("services/app-service.ts");

  it("stores the promise in a module-level variable", () => {
    expect(src).toMatch(/_infoPromise/);
  });

  it("returns the cached promise on subsequent calls (no new fetch)", () => {
    // Pattern: if (!_infoPromise) { _infoPromise = Service.get(...) } return _infoPromise
    expect(src).toMatch(/if\s*\(\s*!_infoPromise\s*\)/);
    expect(src).toMatch(/return\s+_infoPromise/);
  });

  it("caches info via closure variable", () => {
    // _infoPromise is set inside getInfo and persists across calls
    expect(src).toMatch(/_infoPromise/);
  });
});

// ===========================================================================
// Guard: App.tsx synchronous mode resolution
// ===========================================================================
describe("App.tsx — synchronous initialization", () => {
  const src = readSrc("App.tsx");

  it("does NOT use useState(null) + useEffect for type resolution", () => {
    // The old pattern: useState(null) + useEffect(setType) creates an extra render
    expect(src).not.toMatch(/useState\s*<.*>\s*\(\s*null\s*\)/);
    expect(src).not.toMatch(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*setType/);
  });

  it("resolves app mode at module level (synchronous URL parsing)", () => {
    expect(src).toMatch(/resolveAppMode|APP_MODE/);
  });

  it("does NOT use a module-level mutable variable for isInstance", () => {
    // Old pattern: let isInstance = false; (mutated during render = side effect)
    expect(src).not.toMatch(/^let\s+isInstance\b/m);
  });
});

// ===========================================================================
// Guard: StoreProvider parallelizes init
// ===========================================================================
describe("StoreProvider — parallel initialization", () => {
  const src = readSrc("store.tsx");

  it("uses Promise.all for concurrent fetching (not sequential await)", () => {
    // Old: const info = await getInfo(); const languages = await getLanguages();
    // New: Promise.all([getInfo(), getLanguages()])
    expect(src).toMatch(/Promise\.all\(\[.*getInfo.*getLanguages/s);
  });
});

// ===========================================================================
// Guard: useAppTheme single state transition
// ===========================================================================
describe("useAppTheme — single state transition", () => {
  const src = readSrc("custom-hooks/useAppTheme.tsx");

  it("uses a single setState call (not separate setThemeOptions + setLoading)", () => {
    // Old: setThemeOptions(result); setLoading(false); → 2 renders
    // New: setState({ themeOptions: result, loading: false }); → 1 render
    expect(src).not.toMatch(/setLoading\s*\(\s*false\s*\)/);
  });

  it("has cleanup to prevent state updates on unmounted component", () => {
    expect(src).toMatch(/cancelled\s*=\s*true/);
  });
});
