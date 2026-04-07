import { describe, it, expect, beforeEach } from "vitest";

import { useCockpitStore } from "../stores/useCockpitStore";

beforeEach(() => {
  // Reset store to initial state before each test
  useCockpitStore.getState().reset();
});

describe("useCockpitStore", () => {
  it("has correct initial state", () => {
    const state = useCockpitStore.getState();

    expect(state.selectedProcessId).toBeNull();
    expect(state.activeTab).toBe("dashboard");
    expect(state.searchQuery).toBe("");
    expect(state.period).toBe("30d");
  });

  it("selectProcess updates selectedProcessId", () => {
    useCockpitStore.getState().selectProcess("42");

    expect(useCockpitStore.getState().selectedProcessId).toBe("42");
  });

  it("selectProcess accepts null to deselect", () => {
    useCockpitStore.getState().selectProcess("42");
    useCockpitStore.getState().selectProcess(null);

    expect(useCockpitStore.getState().selectedProcessId).toBeNull();
  });

  it("setActiveTab updates activeTab", () => {
    useCockpitStore.getState().setActiveTab("process-detail");

    expect(useCockpitStore.getState().activeTab).toBe("process-detail");
  });

  it("setSearchQuery updates searchQuery", () => {
    useCockpitStore.getState().setSearchQuery("leave request");

    expect(useCockpitStore.getState().searchQuery).toBe("leave request");
  });

  it("setPeriod updates period", () => {
    useCockpitStore.getState().setPeriod("7d");

    expect(useCockpitStore.getState().period).toBe("7d");
  });

  it("reset() returns to initial state", () => {
    // Mutate all fields
    const store = useCockpitStore.getState();
    store.selectProcess("99");
    store.setActiveTab("process-detail");
    store.setSearchQuery("something");
    store.setPeriod("90d");

    // Reset
    useCockpitStore.getState().reset();

    // Verify all back to initial
    const state = useCockpitStore.getState();
    expect(state.selectedProcessId).toBeNull();
    expect(state.activeTab).toBe("dashboard");
    expect(state.searchQuery).toBe("");
    expect(state.period).toBe("30d");
  });
});
