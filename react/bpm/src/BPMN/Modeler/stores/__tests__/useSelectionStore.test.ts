import { describe, it, expect, beforeEach } from "vitest";
import type { ModdleElement } from "@studio/shared/types";

import useSelectionStore from "../useSelectionStore";

const mockElement = { id: "Task_1" } as unknown as ModdleElement;

describe("useSelectionStore", () => {
  beforeEach(() => {
    useSelectionStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useSelectionStore.getState();
    expect(state.selectedElement).toBeNull();
    expect(state.isMenuActionDisable).toBe(false);
    expect(state.comments).toBeNull();
  });

  it("setSelectedElement updates selectedElement", () => {
    useSelectionStore.getState().setSelectedElement(mockElement);
    expect(useSelectionStore.getState().selectedElement).toEqual(mockElement);
  });

  it("setMenuActionDisable updates isMenuActionDisable", () => {
    useSelectionStore.getState().setMenuActionDisable(true);
    expect(useSelectionStore.getState().isMenuActionDisable).toBe(true);
  });

  it("setComments updates comments", () => {
    useSelectionStore.getState().setComments(5);
    expect(useSelectionStore.getState().comments).toBe(5);
  });

  it("incrementComments increments from current value", () => {
    useSelectionStore.getState().setComments(5);
    useSelectionStore.getState().incrementComments();
    expect(useSelectionStore.getState().comments).toBe(6);
  });

  it("incrementComments treats null as 0", () => {
    useSelectionStore.getState().incrementComments();
    expect(useSelectionStore.getState().comments).toBe(1);
  });

  it("decrementComments decrements from current value", () => {
    useSelectionStore.getState().setComments(6);
    useSelectionStore.getState().decrementComments();
    expect(useSelectionStore.getState().comments).toBe(5);
  });

  it("decrementComments treats null as 0", () => {
    useSelectionStore.getState().decrementComments();
    expect(useSelectionStore.getState().comments).toBe(-1);
  });

  it("reset restores all fields to initial state", () => {
    useSelectionStore.getState().setSelectedElement(mockElement);
    useSelectionStore.getState().setMenuActionDisable(true);
    useSelectionStore.getState().setComments(5);

    useSelectionStore.getState().reset();

    const state = useSelectionStore.getState();
    expect(state.selectedElement).toBeNull();
    expect(state.isMenuActionDisable).toBe(false);
    expect(state.comments).toBeNull();
  });
});
