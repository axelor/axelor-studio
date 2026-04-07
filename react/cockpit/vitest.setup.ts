// ECharts canvas mock — prevents jsdom canvas errors in chart tests
import "./src/__tests__/setup-echarts-mock";
// bpmn-js NavigatedViewer mock — prevents jsdom SVG errors in BPMN tests
import "./src/__tests__/setup-bpmn-mock";

// npm-based setup
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

// MSW server for intercepting cockpit API calls
import { server } from "./src/__tests__/msw/server";

// Polyfill matchMedia for jsdom (used by useAnimatedCounter for prefers-reduced-motion)
if (typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Polyfill ResizeObserver for jsdom (used by layout components)
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(_cb: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Mock window.top.axelor for iframe bridge
Object.defineProperty(window, "top", {
  value: {
    axelor: {
      $openHtmlTab: () => {},
      $openTab: () => {},
    },
  },
  writable: true,
});

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
