import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { ModelerContext } from "../context/ModelerContext";
import { useModelerEvent } from "../hooks/useModelerEvent";

// Create a mock modeler with trackable eventBus
function createMockModeler() {
  const onCalls: Array<{ event: string; handler: () => void }> = [];
  const offCalls: Array<{ event: string; handler: () => void }> = [];

  const eventBus = {
    on: vi.fn((event: string, handler: () => void) => {
      onCalls.push({ event, handler });
    }),
    off: vi.fn((event: string, handler: () => void) => {
      offCalls.push({ event, handler });
    }),
  };

  return {
    modeler: {
      get: vi.fn((name: string) => {
        if (name === "eventBus") return eventBus;
        return undefined;
      }),
      getDefinitions: vi.fn(),
      destroy: vi.fn(),
    },
    eventBus,
    onCalls,
    offCalls,
  };
}

// Wrapper that provides a mock modeler via context
function MockProvider({ modeler, children }: { modeler: unknown; children: React.ReactNode }) {
  return <ModelerContext.Provider value={modeler as React.ComponentProps<typeof ModelerContext.Provider>['value']}>{children}</ModelerContext.Provider>;
}

// Test component that uses useModelerEvent
function EventConsumer({ eventName, handler }: { eventName: string; handler: () => void }) {
  useModelerEvent(eventName, handler);
  return <div data-testid="event-consumer">listening</div>;
}

describe("useModelerEvent", () => {
  let mock: ReturnType<typeof createMockModeler>;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = createMockModeler();
  });

  it("registers event handler via eventBus.on() when modeler is available", () => {
    const handler = vi.fn();

    render(
      <MockProvider modeler={mock.modeler}>
        <EventConsumer eventName="element.click" handler={handler} />
      </MockProvider>,
    );

    expect(mock.eventBus.on).toHaveBeenCalledTimes(1);
    expect(mock.eventBus.on).toHaveBeenCalledWith("element.click", expect.any(Function));
  });

  it("unregisters via eventBus.off() with the SAME handler reference on unmount", () => {
    const handler = vi.fn();

    const { unmount } = render(
      <MockProvider modeler={mock.modeler}>
        <EventConsumer eventName="element.click" handler={handler} />
      </MockProvider>,
    );

    const registeredHandler = mock.eventBus.on.mock.calls[0][1];

    act(() => {
      unmount();
    });

    expect(mock.eventBus.off).toHaveBeenCalledTimes(1);
    expect(mock.eventBus.off).toHaveBeenCalledWith("element.click", registeredHandler);
  });

  it("does nothing when modeler is null", () => {
    const handler = vi.fn();

    // Render without provider (useModeler returns null)
    render(<EventConsumer eventName="element.click" handler={handler} />);

    // Should not crash and no eventBus calls
    expect(screen.getByTestId("event-consumer")).toBeDefined();
  });

  it("after N mount/unmount cycles, on/off call counts are equal", () => {
    const handler = vi.fn();
    const CYCLES = 5;

    for (let i = 0; i < CYCLES; i++) {
      const { unmount } = render(
        <MockProvider modeler={mock.modeler}>
          <EventConsumer eventName="element.click" handler={handler} />
        </MockProvider>,
      );
      act(() => {
        unmount();
      });
    }

    expect(mock.eventBus.on).toHaveBeenCalledTimes(CYCLES);
    expect(mock.eventBus.off).toHaveBeenCalledTimes(CYCLES);

    // Verify every handler registered via .on() was also unregistered via .off()
    for (let i = 0; i < CYCLES; i++) {
      const onHandler = mock.eventBus.on.mock.calls[i][1];
      const offHandler = mock.eventBus.off.mock.calls[i][1];
      expect(onHandler).toBe(offHandler);
    }
  });

  it("re-registers when deps change (handler reference updates)", () => {
    function DynamicConsumer() {
      const [count, setCount] = useState(0);

      // Pass deps to useModelerEvent so its internal useCallback updates
      useModelerEvent("element.click", () => count, [count]);

      return (
        <button data-testid="increment" onClick={() => setCount((c) => c + 1)}>
          {count}
        </button>
      );
    }

    render(
      <MockProvider modeler={mock.modeler}>
        <DynamicConsumer />
      </MockProvider>,
    );

    expect(mock.eventBus.on).toHaveBeenCalledTimes(1);

    // Trigger state change that changes the deps -> new handler reference
    act(() => {
      screen.getByTestId("increment").click();
    });

    // Should have unregistered old and registered new
    expect(mock.eventBus.off).toHaveBeenCalledTimes(1);
    expect(mock.eventBus.on).toHaveBeenCalledTimes(2);
  });
});
