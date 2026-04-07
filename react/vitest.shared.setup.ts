/**
 * Shared test setup polyfills for all packages.
 *
 * This file contains ONLY polyfills and mocks that don't depend on
 * any npm packages (they use globalThis/window APIs).
 *
 * Each package's vitest.setup.ts imports this file AND the npm-based
 * setup (jest-dom, testing-library cleanup) from its own node_modules.
 */

// Polyfill ResizeObserver for jsdom (used by @axelor/ui components)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_cb: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver; // safety: test environment mock for ResizeObserver
}

// Polyfill IntersectionObserver for jsdom (used by TabChangeContext)
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(_cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver; // safety: test environment mock for IntersectionObserver
}

// Mock window.top.axelor for iframe-dependent code
declare global {
  interface Window {
    axelor?: {
      i18n: { get: (key: string) => string };
      dialogs: {
        error: (opts: { content: string }) => () => void;
        confirm: () => void;
      };
    };
  }
}

if (!window.top?.axelor) {
  window.top!.axelor = { // safety: window.top is guaranteed non-null in non-iframe test environment
    i18n: { get: (key: string) => key },
    dialogs: {
      error: ({ content }: { content: string }) => () => {},
      confirm: () => {},
    },
  };
}
