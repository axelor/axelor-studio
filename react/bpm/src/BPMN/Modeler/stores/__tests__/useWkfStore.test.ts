import { describe, it, expect, beforeEach } from "vitest";

import useWkfStore from "../useWkfStore";

describe("useWkfStore", () => {
  beforeEach(() => {
    useWkfStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useWkfStore.getState();
    expect(state.wkf).toBeNull();
    expect(state.id).toBeNull();
    expect(state.enableStudioApp).toBe(false);
    expect(state.showError).toBe(false);
  });

  it("setWkf updates wkf", () => {
    useWkfStore.getState().setWkf({ name: "test" });
    expect(useWkfStore.getState().wkf).toEqual({ name: "test" });
  });

  it("setId updates id", () => {
    useWkfStore.getState().setId(42);
    expect(useWkfStore.getState().id).toBe(42);
  });

  it("setEnableStudioApp updates enableStudioApp", () => {
    useWkfStore.getState().setEnableStudioApp(true);
    expect(useWkfStore.getState().enableStudioApp).toBe(true);
  });

  it("setShowError updates showError", () => {
    useWkfStore.getState().setShowError(true);
    expect(useWkfStore.getState().showError).toBe(true);
  });

  it("reset restores all fields to initial state", () => {
    useWkfStore.getState().setWkf({ name: "test" });
    useWkfStore.getState().setId(42);
    useWkfStore.getState().setEnableStudioApp(true);
    useWkfStore.getState().setShowError(true);

    useWkfStore.getState().reset();

    const state = useWkfStore.getState();
    expect(state.wkf).toBeNull();
    expect(state.id).toBeNull();
    expect(state.enableStudioApp).toBe(false);
    expect(state.showError).toBe(false);
  });
});
