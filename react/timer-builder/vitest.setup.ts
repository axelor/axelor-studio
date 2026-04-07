// Shared polyfills (ResizeObserver, IntersectionObserver, window.top.axelor)
import "../vitest.shared.setup";
// npm-based setup (resolved from this package's node_modules)
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
