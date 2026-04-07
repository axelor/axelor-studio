import { describe, it, expect, vi } from "vitest";

import ReadOnly from "../custom/readonly/ReadOnly";

function createMockDependencies() {
  const listeners: Array<(e: { readOnly: boolean }) => void> = [];
  return {
    eventBus: {
      on: vi.fn((_event: string, _priority: number, cb: (e: { readOnly: boolean }) => void) => {
        listeners.push(cb);
      }),
      fire: vi.fn((_event: string, payload: { readOnly: boolean }) => {
        listeners.forEach((cb) => cb(payload));
      }),
    },
    contextPad: { open: vi.fn(), close: vi.fn() },
    dragging: { cancel: vi.fn() },
    directEditing: { cancel: vi.fn() },
    editorActions: {},
    modeling: {
      createConnection: vi.fn(),
      createShape: vi.fn(),
      createLabel: vi.fn(),
      appendShape: vi.fn(),
      removeElements: vi.fn(),
      distributeElements: vi.fn(),
      removeShape: vi.fn(),
      removeConnection: vi.fn(),
      replaceShape: vi.fn(),
      pasteElements: vi.fn(),
      alignElements: vi.fn(),
      createSpace: vi.fn(),
      updateWaypoints: vi.fn(),
      reconnectStart: vi.fn(),
      reconnectEnd: vi.fn(),
    },
    palette: { _update: vi.fn() },
    paletteProvider: { getPaletteEntries: vi.fn(() => ({})) },
  };
}

describe("ReadOnly", () => {
  it("readOnly() returns false initially", () => {
    const deps = createMockDependencies();
    const ro = new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    expect(ro.readOnly()).toBe(false);
  });

  it("readOnly(true) activates read-only mode and fires event", () => {
    const deps = createMockDependencies();
    const ro = new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    const result = ro.readOnly(true);

    expect(result).toBe(true);
    expect(deps.eventBus.fire).toHaveBeenCalledWith("readOnly.changed", { readOnly: true });
  });

  it("readOnly(false) deactivates read-only mode", () => {
    const deps = createMockDependencies();
    const ro = new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    ro.readOnly(true);
    const result = ro.readOnly(false);

    expect(result).toBe(false);
  });

  it("readOnly(true) when already read-only returns current value without firing", () => {
    const deps = createMockDependencies();
    const ro = new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    ro.readOnly(true);
    deps.eventBus.fire.mockClear();

    const result = ro.readOnly(true);

    expect(result).toBe(true);
    expect(deps.eventBus.fire).not.toHaveBeenCalled();
  });

  it("entering read-only cancels direct editing, context pad, and dragging", () => {
    const deps = createMockDependencies();
    new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    deps.eventBus.fire("readOnly.changed", { readOnly: true });

    expect(deps.directEditing.cancel).toHaveBeenCalled();
    expect(deps.contextPad.close).toHaveBeenCalled();
    expect(deps.dragging.cancel).toHaveBeenCalled();
    expect(deps.palette._update).toHaveBeenCalled();
  });

  it("modeling operations are blocked in read-only mode", () => {
    const deps = createMockDependencies();
    const originalCreateShape = vi.fn(() => "created");
    deps.modeling.createShape = originalCreateShape;

    new ReadOnly(
      deps.eventBus, deps.contextPad, deps.dragging, deps.directEditing,
      deps.editorActions, deps.modeling, deps.palette, deps.paletteProvider,
    );

    // Activate read-only via the event mechanism
    deps.eventBus.fire("readOnly.changed", { readOnly: true });

    // The intercepted createShape should return undefined (blocked)
    const result = deps.modeling.createShape();
    expect(result).toBeUndefined();
    expect(originalCreateShape).not.toHaveBeenCalled();
  });
});
