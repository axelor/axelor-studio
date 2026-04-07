import { describe, it, expect, vi } from "vitest";

describe("utils.jsx - Characterization Tests", () => {
  describe("getParams", () => {
    it("returns isSplit=true when type=split", async () => {
      window.history.replaceState({}, "", "http://localhost:3000?type=split&id=42");

      const { getParams } = await import("../utils");
      const params = getParams();

      expect(params.isSplit).toBe(true);
      expect(params.isMerge).toBe(false);
      expect(params.id).toBe("42");
    });

    it("returns isMerge=true when type=merge", async () => {
      window.history.replaceState({}, "", "http://localhost:3000?type=merge&id=7");

      vi.resetModules();
      const { getParams } = await import("../utils");
      const params = getParams();

      expect(params.isMerge).toBe(true);
      expect(params.isSplit).toBe(false);
      expect(params.id).toBe("7");
    });

    it("returns both false when no type param", async () => {
      window.history.replaceState({}, "", "http://localhost:3000");

      vi.resetModules();
      const { getParams } = await import("../utils");
      const params = getParams();

      expect(params.isSplit).toBe(false);
      expect(params.isMerge).toBe(false);
      expect(params.id).toBeNull();
    });
  });

  describe("setParam", () => {
    it("sets URL parameter using history.replaceState", async () => {
      window.history.replaceState({}, "", "http://localhost:3000?type=merge");

      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      vi.resetModules();
      const { setParam } = await import("../utils");
      setParam("id", "123");

      expect(replaceStateSpy).toHaveBeenCalledWith({}, "", expect.stringContaining("id=123"));

      replaceStateSpy.mockRestore();
    });
  });
});
