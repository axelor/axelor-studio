import { describe, it, expect, beforeEach } from "vitest";

import { createSnackbarStore } from "../createSnackbarStore";

describe("createSnackbarStore", () => {
  let store;

  beforeEach(() => {
    store = createSnackbarStore();
  });

  it("creates a store with correct initial state", () => {
    const state = store.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });

  it("show sets open, messageType, and message", () => {
    store.getState().show("danger", "Error msg");

    const state = store.getState();
    expect(state.open).toBe(true);
    expect(state.messageType).toBe("danger");
    expect(state.message).toBe("Error msg");
  });

  it("close resets open, message, and messageType", () => {
    store.getState().show("danger", "Error msg");
    store.getState().close();

    const state = store.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });

  it("reset has same effect as close", () => {
    store.getState().show("success", "Saved");
    store.getState().reset();

    const state = store.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });

  it("two instances are fully independent", () => {
    const storeA = createSnackbarStore();
    const storeB = createSnackbarStore();

    storeA.getState().show("danger", "Error in A");

    expect(storeA.getState().open).toBe(true);
    expect(storeA.getState().message).toBe("Error in A");

    expect(storeB.getState().open).toBe(false);
    expect(storeB.getState().message).toBeNull();
  });
});
