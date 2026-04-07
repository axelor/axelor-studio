import { describe, it, expect, beforeEach } from "vitest";

import useSnackbarStore from "../useSnackbarStore";

describe("useSnackbarStore", () => {
  beforeEach(() => {
    useSnackbarStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useSnackbarStore.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });

  it("show sets open, messageType, and message", () => {
    useSnackbarStore.getState().show("danger", "Error msg");

    const state = useSnackbarStore.getState();
    expect(state.open).toBe(true);
    expect(state.messageType).toBe("danger");
    expect(state.message).toBe("Error msg");
  });

  it("close resets open, message, and messageType", () => {
    useSnackbarStore.getState().show("danger", "Error msg");
    useSnackbarStore.getState().close();

    const state = useSnackbarStore.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });

  it("reset has same effect as close", () => {
    useSnackbarStore.getState().show("success", "Saved");
    useSnackbarStore.getState().reset();

    const state = useSnackbarStore.getState();
    expect(state.open).toBe(false);
    expect(state.message).toBeNull();
    expect(state.messageType).toBeNull();
  });
});
