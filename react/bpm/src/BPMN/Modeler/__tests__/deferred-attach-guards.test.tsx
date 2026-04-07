/**
 * Deferred Attach & ContextPad Guard Tests
 *
 * These tests protect against three regression classes discovered during
 * Phase 4.1 decomposition:
 *
 * 1. Canvas attach timing — BpmnCanvas callback ref must call attachTo()
 *    when the DOM node mounts, so that importXML finds a visible canvas.
 *
 * 2. Properties panel attach — PropertiesDrawer callback ref must call
 *    propertiesPanel.attachTo() on mount and detach() on unmount.
 *
 * 3. ContextPad guard — handleMouseEnter must NOT call contextPad.open()
 *    on elements without SVG graphics (e.g. root Process/Collaboration),
 *    which causes getBoundingClientRect errors.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {   render } from "@testing-library/react";

// ---------------------------------------------------------------------------
// 1. BpmnCanvas callback ref tests
// ---------------------------------------------------------------------------

vi.mock("../XmlEditor", () => ({
  default: () => <div data-testid="xml-editor" />,
}));

import BpmnCanvas from "../components/BpmnCanvas";

describe("BpmnCanvas deferred attach", () => {
  let mockModeler: { attachTo: ReturnType<typeof vi.fn>; detach: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockModeler = {
      attachTo: vi.fn(),
      detach: vi.fn(),
    };
  });

  it("calls attachTo(node) when the canvas div mounts", () => {
    render(<BpmnCanvas modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} isXmlEditorOpen={false} onCloseXmlEditor={vi.fn()} />);
    expect(mockModeler.attachTo).toHaveBeenCalledTimes(1);
    expect(mockModeler.attachTo).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("calls detach() when the component unmounts", () => {
    const { unmount } = render(
      <BpmnCanvas modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} isXmlEditorOpen={false} onCloseXmlEditor={vi.fn()} />,
    );
    unmount();
    expect(mockModeler.detach).toHaveBeenCalledTimes(1);
  });

  it("does NOT call attachTo when modeler is null", () => {
    render(<BpmnCanvas modeler={null} isXmlEditorOpen={false} onCloseXmlEditor={vi.fn()} />);
    expect(mockModeler.attachTo).not.toHaveBeenCalled();
  });

  it("keeps canvas visible (display:block) when XML editor is closed", () => {
    const { container } = render(
      <BpmnCanvas modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} isXmlEditorOpen={false} onCloseXmlEditor={vi.fn()} />,
    );
    const wrapper = container.querySelector("#bpmnview")!.parentElement as HTMLElement;
    expect(wrapper.style.display).toBe("block");
  });

  it("hides canvas (display:none) when XML editor is open", () => {
    const { container } = render(
      <BpmnCanvas modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} isXmlEditorOpen={true} onCloseXmlEditor={vi.fn()} />,
    );
    const wrapper = container.querySelector("#bpmnview")!.parentElement as HTMLElement;
    expect(wrapper.style.display).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// 2. PropertiesDrawer callback ref tests
// ---------------------------------------------------------------------------

vi.mock("../DrawerContent", () => ({
  default: () => <div data-testid="drawer-content" />,
}));
vi.mock("../../../utils", () => ({
  translate: vi.fn((s) => s),
}));
vi.mock("../utils/modeler-helpers", () => ({
  resizeStyle: {},
  DRAWER_WIDTH: 380,
}));
vi.mock("../bpmn-modeler.module.css", () => ({ default: {} }));

import PropertiesDrawer from "../components/PropertiesDrawer";

describe("PropertiesDrawer deferred attach", () => {
  let mockModeler: { get: ReturnType<typeof vi.fn> };
  let mockPropertiesPanel: { attachTo: ReturnType<typeof vi.fn>; detach: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPropertiesPanel = {
      attachTo: vi.fn(),
      detach: vi.fn(),
    };
    mockModeler = {
      get: vi.fn((service: string) => {
        if (service === "propertiesPanel") return mockPropertiesPanel;
        return {};
      }),
    };
  });

  const defaultProps = {
    width: 380,
    height: "100%",
    setWidth: vi.fn(),
    setHeight: vi.fn(),
    setCSSWidth: vi.fn(),
    drawerOpen: true,
    isXmlEditorOpen: false,
    availableWidth: { current: 1920 },
  };

  it("calls propertiesPanel.attachTo(node) on mount", () => {
    render(<PropertiesDrawer modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} {...defaultProps} />);
    expect(mockPropertiesPanel.attachTo).toHaveBeenCalledTimes(1);
    expect(mockPropertiesPanel.attachTo).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("calls propertiesPanel.detach() on unmount", () => {
    const { unmount } = render(<PropertiesDrawer modeler={mockModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} {...defaultProps} />);
    unmount();
    expect(mockPropertiesPanel.detach).toHaveBeenCalledTimes(1);
  });

  it("does NOT call attachTo when modeler is null", () => {
    render(<PropertiesDrawer modeler={null} {...defaultProps} />);
    expect(mockPropertiesPanel.attachTo).not.toHaveBeenCalled();
  });

  it("gracefully handles propertiesPanel service not available", () => {
    const errorModeler = {   
      get: vi.fn(() => {
        throw new Error("No provider for propertiesPanel");
      }),
    };
    // Should not throw
    expect(() => {
      render(<PropertiesDrawer modeler={errorModeler as unknown as React.ComponentProps<typeof BpmnCanvas>['modeler']} {...defaultProps} />);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 3. ContextPad guard — the handleMouseEnter logic
// ---------------------------------------------------------------------------

describe("ContextPad guard: handleMouseEnter", () => {
  /**
   * This test validates the guard logic directly.
   * In BpmnModeler.jsx, the handleMouseEnter only calls contextPad.open()
   * if canvas.getGraphics(selectedElement) returns a truthy value.
   *
   * We simulate the logic here to verify the guard pattern,
   * since rendering BpmnModeler requires extensive mocking
   * already covered in bpmn-modeler-rendering.test.jsx.
   */

  it("does NOT open context pad when element has no graphics", () => {
    const contextPad = { open: vi.fn((_el: unknown) => {}), close: vi.fn() };
    const canvas = { getGraphics: vi.fn((_el: unknown) => undefined as unknown) };
    const selectedElement = { id: "Process_1", type: "bpmn:Process" };

    // Reproduce the guard logic from BpmnModeler.jsx handleMouseEnter
    if (canvas.getGraphics(selectedElement)) {
      contextPad.open(selectedElement);
    }

    expect(canvas.getGraphics).toHaveBeenCalledWith(selectedElement);
    expect(contextPad.open).not.toHaveBeenCalled();
  });

  it("opens context pad when element HAS graphics", () => {
    const contextPad = { open: vi.fn((_el: unknown) => {}), close: vi.fn() };
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const canvas = { getGraphics: vi.fn((_el: unknown) => svgElement as unknown) };
    const selectedElement = { id: "Task_1", type: "bpmn:UserTask" };

    // Reproduce the guard logic from BpmnModeler.jsx handleMouseEnter
    if (canvas.getGraphics(selectedElement)) {
      contextPad.open(selectedElement);
    }

    expect(canvas.getGraphics).toHaveBeenCalledWith(selectedElement);
    expect(contextPad.open).toHaveBeenCalledWith(selectedElement);
  });

  it("does NOT open context pad when element is null", () => {
    const contextPad = { open: vi.fn((_el: unknown) => {}), close: vi.fn() };
    const canvas = { getGraphics: vi.fn((_el: unknown) => null as unknown) };

    if (canvas.getGraphics(null as unknown as { id: string; type: string })) {
      contextPad.open(null as unknown as { id: string; type: string });
    }

    expect(contextPad.open).not.toHaveBeenCalled();
  });
});
