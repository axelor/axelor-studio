// Shared polyfills (ResizeObserver, IntersectionObserver, window.top.axelor)
import "../vitest.shared.setup";
// npm-based setup (resolved from this package's node_modules)
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
// dayjs customParseFormat must be extended globally before any test runs
// (the per-file extend in expression-generation.ts doesn't survive Vitest's module transform)
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

afterEach(() => {
  cleanup();
});
