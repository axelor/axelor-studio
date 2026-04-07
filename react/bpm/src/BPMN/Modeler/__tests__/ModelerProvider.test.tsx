import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// Use vi.hoisted to define mocks before vi.mock hoisting
const { mockDestroy, MockBpmnModeler } = vi.hoisted(() => {
  const mockDestroy = vi.fn();
  const MockBpmnModeler = vi.fn().mockImplementation(() => ({
    destroy: mockDestroy,
    get: vi.fn(),
    getDefinitions: vi.fn(),
  }));
  return { mockDestroy, MockBpmnModeler };
});

vi.mock("bpmn-js/lib/Modeler", () => ({
  default: MockBpmnModeler,
}));

import { ModelerProvider } from "../context/ModelerContext";
import { useModeler } from "../hooks/useModeler";

// Test component that uses useModeler and displays its value
function ModelerConsumer() {
  const modeler = useModeler();
  return <div data-testid="consumer">{modeler ? "has-modeler" : "no-modeler"}</div>;
}

describe("ModelerProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides modeler instance to children via useModeler()", async () => {
    await act(async () => {
      render(
        <ModelerProvider config={{}}>
          <ModelerConsumer />
        </ModelerProvider>,
      );
    });

    expect(screen.getByTestId("consumer").textContent).toBe("has-modeler");
    expect(MockBpmnModeler).toHaveBeenCalledTimes(1);
  });

  it("calls destroy() on unmount", async () => {
    let unmount: () => void;
    await act(async () => {
      const result = render(
        <ModelerProvider config={{}}>
          <ModelerConsumer />
        </ModelerProvider>,
      );
      unmount = result.unmount;
    });

    expect(mockDestroy).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });
});

describe("useModeler", () => {
  it("returns null when no Provider in tree", () => {
    render(<ModelerConsumer />);
    expect(screen.getByTestId("consumer").textContent).toBe("no-modeler");
  });
});
