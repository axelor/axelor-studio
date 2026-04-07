/**
 * Event Cleanup Test
 *
 * Verifies that mounting and unmounting a component using useModelerEvent
 * does NOT accumulate event listeners. After each mount/unmount cycle,
 * the number of .on() calls must equal the number of .off() calls.
 * After N cycles, total .on() === total .off().
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {  render } from "@testing-library/react";

import { ModelerContext } from "../context/ModelerContext";
import { useModelerEvent } from "../hooks/useModelerEvent";

// A test component that registers 3 event listeners via useModelerEvent
function TestEventComponent() {
  useModelerEvent("elements.changed", () => {});
  useModelerEvent("element.click", () => {});
  useModelerEvent("selection.changed", () => {});
  return <div data-testid="test-component">Test</div>;
}

describe("Event Cleanup: useModelerEvent mount/unmount cycles", () => {
  let onSpy: ReturnType<typeof vi.fn>;
  let offSpy: ReturnType<typeof vi.fn>;
  let mockModeler: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onSpy = vi.fn();
    offSpy = vi.fn();
    mockModeler = {
      get: vi.fn((service: string) => {
        if (service === "eventBus") {
          return { on: onSpy, off: offSpy };
        }
        return {};
      }),
    };
  });

  it("after 1 mount/unmount cycle: on count equals off count", () => {
    const { unmount } = render(
      <ModelerContext.Provider value={mockModeler as unknown as React.ComponentProps<typeof ModelerContext.Provider>['value']}>
        <TestEventComponent />
      </ModelerContext.Provider>,
    );

    const onCountAfterMount = onSpy.mock.calls.length;
    expect(onCountAfterMount).toBe(3); // 3 useModelerEvent calls

    unmount();

    expect(offSpy.mock.calls.length).toBe(onCountAfterMount);
  });

  it("after 5 mount/unmount cycles: total on count equals total off count (zero accumulation)", () => {
    for (let i = 0; i < 5; i++) {
      const { unmount } = render(
        <ModelerContext.Provider value={mockModeler as unknown as React.ComponentProps<typeof ModelerContext.Provider>['value']}>
          <TestEventComponent />
        </ModelerContext.Provider>,
      );
      unmount();
    }

    // After 5 full cycles: 5 * 3 = 15 on calls, 15 off calls
    expect(onSpy.mock.calls.length).toBe(15);
    expect(offSpy.mock.calls.length).toBe(15);
    expect(onSpy.mock.calls.length).toBe(offSpy.mock.calls.length);
  });

  it("each on/off call uses the SAME handler reference (identity match)", () => {
    const { unmount } = render(
      <ModelerContext.Provider value={mockModeler as unknown as React.ComponentProps<typeof ModelerContext.Provider>['value']}>
        <TestEventComponent />
      </ModelerContext.Provider>,
    );
    unmount();

    // For each event, the handler passed to .on() must be the exact same
    // reference passed to .off() -- otherwise cleanup won't work
    for (let i = 0; i < onSpy.mock.calls.length; i++) {
      const [onEvent, onHandler] = onSpy.mock.calls[i];
      const [offEvent, offHandler] = offSpy.mock.calls[i];
      expect(onEvent).toBe(offEvent);
      expect(onHandler).toBe(offHandler);
    }
  });

  it("with null modeler: no on/off calls are made", () => {
    const { unmount } = render(
      <ModelerContext.Provider value={null}>
        <TestEventComponent />
      </ModelerContext.Provider>,
    );
    unmount();

    expect(onSpy.mock.calls.length).toBe(0);
    expect(offSpy.mock.calls.length).toBe(0);
  });
});
