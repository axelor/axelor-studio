import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { syncAxelorTabDirty } from "../sync-axelor-tab";

describe("syncAxelorTabDirty", () => {
  let originalTop: typeof window.top;

  beforeEach(() => {
    originalTop = window.top;
  });

  afterEach(() => {
    // Restore window.top
    Object.defineProperty(window, "top", {
      value: originalTop,
      writable: true,
      configurable: true,
    });
  });

  it("calls axelor.useActiveTab setter with { dirty: true }", () => {
    const setTabState = vi.fn();
    const mockAxelor = {
      useActiveTab: () => [null, setTabState],
    };
    Object.defineProperty(window, "top", {
      value: { axelor: mockAxelor },
      writable: true,
      configurable: true,
    });

    syncAxelorTabDirty(true);

    expect(setTabState).toHaveBeenCalledWith({ dirty: true });
  });

  it("calls axelor.useActiveTab setter with { dirty: false }", () => {
    const setTabState = vi.fn();
    const mockAxelor = {
      useActiveTab: () => [null, setTabState],
    };
    Object.defineProperty(window, "top", {
      value: { axelor: mockAxelor },
      writable: true,
      configurable: true,
    });

    syncAxelorTabDirty(false);

    expect(setTabState).toHaveBeenCalledWith({ dirty: false });
  });

  it("is no-op when window.top.axelor is undefined", () => {
    Object.defineProperty(window, "top", {
      value: {},
      writable: true,
      configurable: true,
    });

    expect(() => syncAxelorTabDirty(true)).not.toThrow();
  });

  it("is no-op when window.top is null", () => {
    Object.defineProperty(window, "top", {
      value: null,
      writable: true,
      configurable: true,
    });

    expect(() => syncAxelorTabDirty(true)).not.toThrow();
  });
});
