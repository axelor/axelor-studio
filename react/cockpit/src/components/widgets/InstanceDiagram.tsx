/**
 * BPMN instance diagram with colored overlays (D-05, D-06, D-07).
 *
 * Renders a NavigatedViewer with:
 * - Active nodes highlighted green (ck-node-active)
 * - Error nodes highlighted red (ck-node-error)
 * - Visited nodes with subtle fill (ck-node-visited)
 * - Pass count badges on all visited nodes
 * - Duration heatmap gradient coloring (fast/medium/slow)
 * - Click-to-inspect in full mode, auto-fit only in mini mode
 */

import { useCallback, useEffect, useRef } from "react";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { useInstanceXml } from "../../hooks/useInstanceXml";
import { useInstanceActivities } from "../../hooks/useInstanceActivities";
import { useNavigatedViewer } from "../../hooks/useNavigatedViewer";
import { createOverlayBadge } from "../shared/BpmnOverlayBadge";
import { ZoomControls } from "../shared/ZoomControls";
import { ErrorBanner } from "../shared/ErrorBanner";
import { LoadingSkeleton } from "../shared/LoadingSkeleton";

import type { ActivityData } from "../../api/types";

import styles from "./InstanceDiagram.module.css";

// ---------------------------------------------------------------------------
// Clickable BPMN element type prefixes
// ---------------------------------------------------------------------------

const CLICKABLE_PREFIXES = [
  "bpmn:Task",
  "bpmn:UserTask",
  "bpmn:ServiceTask",
  "bpmn:ScriptTask",
  "bpmn:BusinessRuleTask",
  "bpmn:SendTask",
  "bpmn:ReceiveTask",
  "bpmn:ManualTask",
  "bpmn:Event",
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:IntermediateCatchEvent",
  "bpmn:IntermediateThrowEvent",
  "bpmn:BoundaryEvent",
  "bpmn:Gateway",
  "bpmn:ExclusiveGateway",
  "bpmn:ParallelGateway",
  "bpmn:InclusiveGateway",
  "bpmn:ComplexGateway",
  "bpmn:EventBasedGateway",
  "bpmn:SubProcess",
  "bpmn:CallActivity",
];

function isClickableElement(type: string): boolean {
  return CLICKABLE_PREFIXES.some(
    (prefix) => type === prefix || type.startsWith(prefix),
  );
}

// ---------------------------------------------------------------------------
// Duration heatmap helpers
// ---------------------------------------------------------------------------

function computeHeatmapClass(
  durationMs: number | null,
  allDurations: number[],
): string | null {
  if (durationMs == null || allDurations.length === 0) return null;
  const sorted = [...allDurations].sort((a, b) => a - b);
  const rank = sorted.indexOf(durationMs);
  const percentile = rank / sorted.length;
  if (percentile <= 0.25) return "ck-node-heatmap-fast";
  if (percentile <= 0.75) return "ck-node-heatmap-medium";
  return "ck-node-heatmap-slow";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InstanceDiagramProps {
  processId: number;
  instanceId: string;
  onNodeClick: (activityId: string) => void;
  mode?: "full" | "mini";
  /** Whether the instance has an error (for error node marking). */
  errorNodeId?: string | null;
}

export function InstanceDiagram({
  processId,
  instanceId,
  onNodeClick,
  mode = "full",
  errorNodeId,
}: InstanceDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useNavigatedViewer(containerRef);
  const overlaysAppliedRef = useRef(false);

  const {
    data: xml,
    isLoading: xmlLoading,
    error: xmlError,
    refetch: refetchXml,
  } = useInstanceXml(processId);

  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useInstanceActivities(instanceId);

  // -----------------------------------------------------------------------
  // Import XML into viewer
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;
    overlaysAppliedRef.current = false;

    void (async () => {
      await viewer.importXML(xml);
      const canvas = viewer.get("canvas") as {
        zoom: (level: string | number, center?: unknown) => number;
      };
      canvas.zoom("fit-viewport", { padding: 40 });
    })();
  }, [viewerRef, xml]);

  // -----------------------------------------------------------------------
  // Apply overlays when activities data is available
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !activitiesData || !xml || overlaysAppliedRef.current)
      return;

    const activities = activitiesData.activities;
    if (!activities || activities.length === 0) return;

    const canvas = viewer.get("canvas") as {
      zoom: (level: string | number, center?: unknown) => number;
      addMarker: (id: string, marker: string) => void;
      removeMarker: (id: string, marker: string) => void;
    };
    const overlays = viewer.get("overlays") as {
      add: (
        id: string,
        type: string,
        config: { position: { bottom: number; right: number }; html: HTMLElement },
      ) => void;
    };

    // Collect all durations for heatmap percentile calculation
    const allDurations = activities
      .filter((a: ActivityData) => a.durationMs != null && a.passCount > 0)
      .map((a: ActivityData) => a.durationMs!);

    activities.forEach((activity: ActivityData) => {
      const { activityId, isActive, passCount, durationMs } = activity;

      // Active node: green stroke
      if (isActive) {
        canvas.addMarker(activityId, "ck-node-active");
      }

      // Error node: red stroke
      if (errorNodeId && activityId === errorNodeId) {
        canvas.addMarker(activityId, "ck-node-error");
      }

      // Visited but not active: subtle fill
      if (passCount > 0 && !isActive) {
        canvas.addMarker(activityId, "ck-node-visited");
      }

      // Pass count badge
      if (passCount > 0) {
        overlays.add(activityId, "pass-count", {
          position: { bottom: 18, right: 18 },
          html: createOverlayBadge(passCount),
        });
      }

      // Duration heatmap
      const heatmapClass = computeHeatmapClass(durationMs, allDurations);
      if (heatmapClass) {
        canvas.addMarker(activityId, heatmapClass);
      }
    });

    overlaysAppliedRef.current = true;
  }, [viewerRef, activitiesData, xml, errorNodeId]);

  // -----------------------------------------------------------------------
  // Node click handler (full mode only)
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || mode !== "full") return;

    const eventBus = viewer.get("eventBus") as {
      on: (event: string, cb: (e: { element: { id: string; type: string } }) => void) => void;
      off: (event: string, cb: (e: { element: { id: string; type: string } }) => void) => void;
    };

    const handler = (e: { element: { id: string; type: string } }) => {
      if (isClickableElement(e.element.type)) {
        onNodeClick(e.element.id);
      }
    };

    eventBus.on("element.click", handler);
    return () => {
      eventBus.off("element.click", handler);
    };
  }, [viewerRef, mode, onNodeClick]);

  // -----------------------------------------------------------------------
  // Zoom controls (full mode only)
  // -----------------------------------------------------------------------

  const handleZoomIn = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as {
      zoom: {
        (): number;
        (level: string | number, center?: unknown): number;
      };
    } | null;
    if (canvas) canvas.zoom(canvas.zoom() * 1.2);
  }, [viewerRef]);

  const handleZoomOut = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as {
      zoom: {
        (): number;
        (level: string | number, center?: unknown): number;
      };
    } | null;
    if (canvas) canvas.zoom(canvas.zoom() / 1.2);
  }, [viewerRef]);

  const handleFit = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as {
      zoom: {
        (): number;
        (level: string | number, center?: unknown): number;
      };
    } | null;
    if (canvas) canvas.zoom("fit-viewport", { padding: 40 });
  }, [viewerRef]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const isLoading = xmlLoading || activitiesLoading;
  const error = xmlError ?? activitiesError;

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorBanner
          message={error instanceof Error ? error.message : "Failed to load diagram"}
          onRetry={() => void refetchXml()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSkeleton height="100%" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.viewer} />
      {mode === "full" && (
        <div className={styles.zoomControls}>
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFit}
          />
        </div>
      )}
    </div>
  );
}
