import { describe, it, expect, beforeEach } from "vitest";

import { createWkfStore } from "../createWkfStore";

describe("createWkfStore", () => {
  describe("BPMN config", () => {
    let store;
    const bpmnConfig = { wkf: null, id: null, enableStudioApp: false, showError: false };

    beforeEach(() => {
      store = createWkfStore(bpmnConfig);
    });

    it("creates a store with correct initial state", () => {
      const state = store.getState();
      expect(state.wkf).toBeNull();
      expect(state.id).toBeNull();
      expect(state.enableStudioApp).toBe(false);
      expect(state.showError).toBe(false);
    });

    it("generates setWkf setter", () => {
      store.getState().setWkf({ name: "test" });
      expect(store.getState().wkf).toEqual({ name: "test" });
    });

    it("generates setId setter", () => {
      store.getState().setId(42);
      expect(store.getState().id).toBe(42);
    });

    it("generates setEnableStudioApp setter", () => {
      store.getState().setEnableStudioApp(true);
      expect(store.getState().enableStudioApp).toBe(true);
    });

    it("generates setShowError setter", () => {
      store.getState().setShowError(true);
      expect(store.getState().showError).toBe(true);
    });

    it("reset restores all fields to initial state", () => {
      store.getState().setWkf({ name: "test" });
      store.getState().setId(42);
      store.getState().setEnableStudioApp(true);
      store.getState().setShowError(true);

      store.getState().reset();

      const state = store.getState();
      expect(state.wkf).toBeNull();
      expect(state.id).toBeNull();
      expect(state.enableStudioApp).toBe(false);
      expect(state.showError).toBe(false);
    });
  });

  describe("DMN config", () => {
    let store;
    const dmnConfig = { wkfModel: null, id: null };

    beforeEach(() => {
      store = createWkfStore(dmnConfig);
    });

    it("creates a store with correct initial state", () => {
      const state = store.getState();
      expect(state.wkfModel).toBeNull();
      expect(state.id).toBeNull();
    });

    it("generates setWkfModel setter", () => {
      store.getState().setWkfModel({ name: "dmn-test" });
      expect(store.getState().wkfModel).toEqual({ name: "dmn-test" });
    });

    it("generates setId setter", () => {
      store.getState().setId(99);
      expect(store.getState().id).toBe(99);
    });

    it("reset restores all fields to initial state", () => {
      store.getState().setWkfModel({ name: "dmn-test" });
      store.getState().setId(99);

      store.getState().reset();

      const state = store.getState();
      expect(state.wkfModel).toBeNull();
      expect(state.id).toBeNull();
    });
  });

  it("two instances are fully independent", () => {
    const storeA = createWkfStore({ wkf: null, id: null });
    const storeB = createWkfStore({ wkfModel: null, id: null });

    storeA.getState().setWkf({ name: "A" });
    storeB.getState().setId(42);

    expect(storeA.getState().wkf).toEqual({ name: "A" });
    expect(storeA.getState().id).toBeNull();

    expect(storeB.getState().wkfModel).toBeNull();
    expect(storeB.getState().id).toBe(42);
  });
});
