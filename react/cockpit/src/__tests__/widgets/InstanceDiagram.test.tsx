/**
 * Tests for InstanceDiagram component.
 *
 * bpmn-js is mocked via setup-bpmn-mock.ts (loaded in vitest.setup.ts).
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockCanvas,
  mockOverlays,
  mockEventBus,
} from "../setup-bpmn-mock";

import type { InstanceActivitiesResponse } from "../../api/types";

// Mock the API hooks
const mockXmlResult = {
  data: "<bpmn:definitions />",
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockActivitiesResult = {
  data: {
    processInstanceId: "inst-1",
    activities: [
      {
        activityId: "task1",
        activityName: "Review",
        activityType: "bpmn:UserTask",
        isActive: true,
        passCount: 3,
        durationMs: 5000,
      },
      {
        activityId: "task2",
        activityName: "Approve",
        activityType: "bpmn:ServiceTask",
        isActive: false,
        passCount: 1,
        durationMs: 2000,
      },
    ],
  } satisfies InstanceActivitiesResponse,
  isLoading: false,
  error: null,
};

vi.mock("../../hooks/useInstanceXml", () => ({
  useInstanceXml: () => mockXmlResult,
}));

vi.mock("../../hooks/useInstanceActivities", () => ({
  useInstanceActivities: () => mockActivitiesResult,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("InstanceDiagram", () => {
  const onNodeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Lazy import to ensure mocks are applied first
  async function loadComponent() {
    const mod = await import(
      "../../components/widgets/InstanceDiagram"
    );
    return mod.InstanceDiagram;
  }

  it("renders without crash", async () => {
    const InstanceDiagram = await loadComponent();
    const { container } = render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
        mode="full"
      />,
      { wrapper: createWrapper() },
    );
    expect(container).toBeTruthy();
  });

  it("calls importXML when XML data is provided", async () => {
    const InstanceDiagram = await loadComponent();
    render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
      />,
      { wrapper: createWrapper() },
    );
    // importXML is async; wait for the fit-viewport zoom call
    await waitFor(() => {
      expect(mockCanvas.zoom).toHaveBeenCalledWith("fit-viewport", {
        padding: 40,
      });
    });
  });

  it("adds overlays for active activities", async () => {
    const InstanceDiagram = await loadComponent();
    render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
      />,
      { wrapper: createWrapper() },
    );
    // overlays.add should be called for pass-count badges
    expect(mockOverlays.add).toHaveBeenCalled();
  });

  it("wires element.click handler in full mode", async () => {
    const InstanceDiagram = await loadComponent();
    render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
        mode="full"
      />,
      { wrapper: createWrapper() },
    );
    expect(mockEventBus.on).toHaveBeenCalledWith(
      "element.click",
      expect.any(Function),
    );
  });

  it("does NOT render ZoomControls in mini mode", async () => {
    const InstanceDiagram = await loadComponent();
    render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
        mode="mini"
      />,
      { wrapper: createWrapper() },
    );
    // ZoomControls buttons should not be present
    expect(screen.queryByLabelText("Zoom in")).toBeNull();
  });

  it("renders ZoomControls in full mode", async () => {
    const InstanceDiagram = await loadComponent();
    render(
      <InstanceDiagram
        processId={1}
        instanceId="inst-1"
        onNodeClick={onNodeClick}
        mode="full"
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByLabelText("Zoom in")).toBeTruthy();
    expect(screen.getByLabelText("Zoom out")).toBeTruthy();
    expect(screen.getByLabelText("Fit to view")).toBeTruthy();
  });
});
