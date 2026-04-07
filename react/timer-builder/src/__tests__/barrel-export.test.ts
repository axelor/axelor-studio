import { describe, it, expect } from "vitest";

// Use relative path to the barrel index (simulates `import from 'timer-builder'`)
import DefaultExport, { App } from "../../index.js";

describe("timer-builder barrel export", () => {
  it("exports App as named export", () => {
    expect(App).toBeDefined();
  });

  it("exports App as default export", () => {
    expect(DefaultExport).toBeDefined();
  });

  it("default export is the same as named App export", () => {
    expect(DefaultExport).toBe(App);
  });

  it("App is a function (React component)", () => {
    expect(typeof App).toBe("function");
  });
});
