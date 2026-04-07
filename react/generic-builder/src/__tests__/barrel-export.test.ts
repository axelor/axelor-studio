import { describe, it, expect } from "vitest";

describe("Barrel exports", () => {
  it("exports ExpressionBuilder", async () => {
    const mod = await import("../../index");
    expect(mod.ExpressionBuilder).toBeDefined();
  });
  it("exports IconButton", async () => {
    const mod = await import("../../index");
    expect(mod.IconButton).toBeDefined();
  });
  it("exports useDialog", async () => {
    const mod = await import("../../index");
    expect(mod.useDialog).toBeDefined();
  });
});
