import { describe, it, expect, beforeEach } from "vitest";

import useTabStore, { type TabItem } from "../useTabStore";

const mockTab = { id: "general", label: "General", groups: [] } as TabItem;

describe("useTabStore", () => {
  beforeEach(() => {
    useTabStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useTabStore.getState();
    expect(state.tabs).toEqual([]);
    expect(state.tabValue).toBe(0);
  });

  it("setTabs updates tabs", () => {
    useTabStore.getState().setTabs([mockTab]);
    expect(useTabStore.getState().tabs).toEqual([mockTab]);
  });

  it("setTabValue updates tabValue", () => {
    useTabStore.getState().setTabValue(2);
    expect(useTabStore.getState().tabValue).toBe(2);
  });

  it("reset restores tabs and tabValue to initial state", () => {
    useTabStore.getState().setTabs([mockTab]);
    useTabStore.getState().setTabValue(2);

    useTabStore.getState().reset();

    const state = useTabStore.getState();
    expect(state.tabs).toEqual([]);
    expect(state.tabValue).toBe(0);
  });
});
