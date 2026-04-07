/**
 * BPMN heatmap viewer with 3-mode overlay (D-11, D-12, D-13).
 *
 * SEPARATE component from InstanceDiagram (per D-11).
 * Modes:
 *   - tokens: green markers for active nodes + pass count badges
 *   - duration: green-to-red gradient based on avg duration
 *   - frequency: intensity gradient based on pass count
 *
 * Overlay cleanup cycle prevents accumulation (Pitfall 5).
 */

import { useCallback, useEffect, useRef } from "react";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";

import { useInstanceXml } from "../../hooks/useInstanceXml";
import { useAnalyticsDuration } from "../../hooks/useAnalyticsDuration";
import { useNavigatedViewer } from "../../hooks/useNavigatedViewer";
import { useCockpitStore } from "../../stores/useCockpitStore";
import { createOverlayBadge } from "../shared/BpmnOverlayBadge";
import { ZoomControls } from "../shared/ZoomControls";
import { ErrorBanner } from "../shared/ErrorBanner";
import { LoadingSkeleton } from "../shared/LoadingSkeleton";
import { HeatmapToggle } from "./HeatmapToggle";
import { VisualMapLegend } from "./VisualMapLegend";
import { formatDuration } from "../../utils/format";

import type { AnalyticsNodeDuration } from "../../api/types";

import styles from "./AnalyticsDiagram.module.css";

// ---------------------------------------------------------------------------
// Heatmap color helpers
// ---------------------------------------------------------------------------

/** CSS custom property names for the 5-stop heatmap gradient. */
const HEATMAP_COLORS = [
  "--ck-heatmap-1",
  "--ck-heatmap-2",
  "--ck-heatmap-3",
  "--ck-heatmap-4",
  "--ck-heatmap-5",
] as const;

/**
 * Map a normalized 0..1 value to one of the 5 heatmap CSS variables.
 * Returns a resolved color string from computed style.
 */
function getHeatmapColor(normalized: number, container: Element): string {
  const idx = Math.min(
    Math.floor(normalized * HEATMAP_COLORS.length),
    HEATMAP_COLORS.length - 1,
  );
  return getComputedStyle(container).getPropertyValue(HEATMAP_COLORS[idx]).trim();
}

/** Normalize a value within [min, max] to 0..1. */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// ---------------------------------------------------------------------------
// Canvas / overlay type aliases (bpmn-js internal API)
// ---------------------------------------------------------------------------

interface BpmnCanvas {
  zoom(): number;
  zoom(level: string | number, center?: unknown): number;
  addMarker(id: string, marker: string): void;
  removeMarker(id: string, marker: string): void;
}

interface BpmnOverlays {
  add(
    id: string,
    type: string,
    config: { position: { bottom: number; right: number }; html: HTMLElement },
  ): string;
  remove(filter: { type: string }): void;
}

interface BpmnEventBus {
  on(event: string, cb: (e: { element: { id: string; type: string } }) => void): void;
  off(event: string, cb: (e: { element: { id: string; type: string } }) => void): void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalyticsDiagramProps {
  processId: number;
  processDefinitionKey: string;
}

export function AnalyticsDiagram({
  processId,
  processDefinitionKey,
}: AnalyticsDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useNavigatedViewer(containerRef);

  // Refs for overlay cleanup (Pitfall 5)
  const markersRef = useRef<Array<{ elementId: string; className: string }>>([]);
  const overlayTypeRef = useRef("analytics-overlay");

  const analyticsMode = useCockpitStore((s) => s.analyticsMode);
  const selectedAnalyticsNodeId = useCockpitStore((s) => s.selectedAnalyticsNodeId);
  const selectAnalyticsNode = useCockpitStore((s) => s.selectAnalyticsNode);

  const period = useCockpitStore((s) => s.period);

  const {
    data: xml,
    isLoading: xmlLoading,
    error: xmlError,
    refetch: refetchXml,
  } = useInstanceXml(processId);

  const {
    data: durationData,
    isLoading: durationLoading,
  } = useAnalyticsDuration(processDefinitionKey, period);

  // -----------------------------------------------------------------------
  // Import XML into viewer
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;

    void (async () => {
      await viewer.importXML(xml);
      const canvas = viewer.get("canvas") as BpmnCanvas;
      canvas.zoom("fit-viewport", { padding: 40 });
    })();
  }, [viewerRef, xml]);

  // -----------------------------------------------------------------------
  // Apply overlays based on analytics mode
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;

    const canvas = viewer.get("canvas") as BpmnCanvas;
    const overlays = viewer.get("overlays") as BpmnOverlays;

    // --- Cleanup previous overlays (Pitfall 5) ---
    for (const { elementId, className } of markersRef.current) {
      try {
        canvas.removeMarker(elementId, className);
      } catch {
        // Element may no longer exist after XML re-import
      }
    }
    markersRef.current = [];

    try {
      overlays.remove({ type: overlayTypeRef.current });
    } catch {
      // No overlays to remove
    }

    const nodes = durationData?.nodes;
    if (!nodes || nodes.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    if (analyticsMode === "tokens") {
      applyTokensOverlay(nodes, canvas, overlays);
    } else if (analyticsMode === "duration") {
      applyDurationOverlay(nodes, canvas, overlays, container);
    } else if (analyticsMode === "frequency") {
      applyFrequencyOverlay(nodes, canvas, overlays, container);
    }
  }, [viewerRef, xml, durationData, analyticsMode]);

  // -----------------------------------------------------------------------
  // Selected node highlight
  // -----------------------------------------------------------------------

  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !xml) return;

    const canvas = viewer.get("canvas") as BpmnCanvas;

    // Remove previous selection marker
    if (prevSelectedRef.current) {
      try {
        canvas.removeMarker(prevSelectedRef.current, "ck-selected-analytics-node");
      } catch {
        // ignore
      }
    }

    // Add new selection marker
    if (selectedAnalyticsNodeId) {
      try {
        canvas.addMarker(selectedAnalyticsNodeId, "ck-selected-analytics-node");
      } catch {
        // ignore
      }
    }

    prevSelectedRef.current = selectedAnalyticsNodeId;
  }, [viewerRef, xml, selectedAnalyticsNodeId]);

  // -----------------------------------------------------------------------
  // Overlay application helpers
  // -----------------------------------------------------------------------

  function applyTokensOverlay(
    nodes: AnalyticsNodeDuration[],
    canvas: BpmnCanvas,
    overlays: BpmnOverlays,
  ) {
    for (const node of nodes) {
      if (node.passCount > 0) {
        canvas.addMarker(node.activityId, "ck-node-active");
        markersRef.current.push({
          elementId: node.activityId,
          className: "ck-node-active",
        });

        overlays.add(node.activityId, overlayTypeRef.current, {
          position: { bottom: 18, right: 18 },
          html: createOverlayBadge(node.passCount),
        });
      }
    }
  }

  function applyDurationOverlay(
    nodes: AnalyticsNodeDuration[],
    canvas: BpmnCanvas,
    overlays: BpmnOverlays,
    container: Element,
  ) {
    const durations = nodes.filter((n) => n.passCount > 0).map((n) => n.avgDuration);
    if (durations.length === 0) return;

    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations);

    for (const node of nodes) {
      if (node.passCount === 0) continue;

      const norm = normalize(node.avgDuration, minDur, maxDur);
      const color = getHeatmapColor(norm, container);

      // Apply colored marker via inline style on the overlay badge
      canvas.addMarker(node.activityId, "ck-heatmap-marker");
      markersRef.current.push({
        elementId: node.activityId,
        className: "ck-heatmap-marker",
      });

      const badge = createHeatmapBadge(formatDuration(node.avgDuration), color);
      overlays.add(node.activityId, overlayTypeRef.current, {
        position: { bottom: -12, right: 10 },
        html: badge,
      });
    }
  }

  function applyFrequencyOverlay(
    nodes: AnalyticsNodeDuration[],
    canvas: BpmnCanvas,
    overlays: BpmnOverlays,
    container: Element,
  ) {
    const counts = nodes.filter((n) => n.passCount > 0).map((n) => n.passCount);
    if (counts.length === 0) return;

    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    for (const node of nodes) {
      if (node.passCount === 0) continue;

      const norm = normalize(node.passCount, minCount, maxCount);
      const color = getHeatmapColor(norm, container);

      canvas.addMarker(node.activityId, "ck-heatmap-marker");
      markersRef.current.push({
        elementId: node.activityId,
        className: "ck-heatmap-marker",
      });

      const badge = createHeatmapBadge(String(node.passCount), color);
      overlays.add(node.activityId, overlayTypeRef.current, {
        position: { bottom: -12, right: 10 },
        html: badge,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Node click handler
  // -----------------------------------------------------------------------

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const eventBus = viewer.get("eventBus") as BpmnEventBus;

    const handler = (e: { element: { id: string; type: string } }) => {
      selectAnalyticsNode(e.element.id);
    };

    eventBus.on("element.click", handler);
    return () => {
      eventBus.off("element.click", handler);
    };
  }, [viewerRef, selectAnalyticsNode]);

  // -----------------------------------------------------------------------
  // Zoom controls
  // -----------------------------------------------------------------------

  const handleZoomIn = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as BpmnCanvas | null;
    if (canvas) canvas.zoom(canvas.zoom() * 1.2);
  }, [viewerRef]);

  const handleZoomOut = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as BpmnCanvas | null;
    if (canvas) canvas.zoom(canvas.zoom() / 1.2);
  }, [viewerRef]);

  const handleFit = useCallback(() => {
    const canvas = viewerRef.current?.get("canvas") as BpmnCanvas | null;
    if (canvas) canvas.zoom("fit-viewport", { padding: 40 });
  }, [viewerRef]);

  // -----------------------------------------------------------------------
  // VisualMap legend data
  // -----------------------------------------------------------------------

  const nodes = durationData?.nodes ?? [];
  const activeNodes = nodes.filter((n) => n.passCount > 0);

  let legendMin = 0;
  let legendMax = 0;

  if (analyticsMode === "duration" && activeNodes.length > 0) {
    legendMin = Math.min(...activeNodes.map((n) => n.avgDuration));
    legendMax = Math.max(...activeNodes.map((n) => n.avgDuration));
  } else if (analyticsMode === "frequency" && activeNodes.length > 0) {
    legendMin = Math.min(...activeNodes.map((n) => n.passCount));
    legendMax = Math.max(...activeNodes.map((n) => n.passCount));
  }

  const legendFormatValue =
    analyticsMode === "duration"
      ? (v: number) => formatDuration(v)
      : (v: number) => String(v);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const isLoading = xmlLoading || durationLoading;
  const error = xmlError;

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
      <div className={styles.container}>
        <LoadingSkeleton height="100%" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HeatmapToggle />
      </div>
      <div className={styles.viewer}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        <div className={styles.zoomControls}>
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFit}
          />
        </div>
      </div>
      {analyticsMode !== "tokens" && activeNodes.length > 0 && (
        <div className={styles.legendContainer}>
          <VisualMapLegend
            minValue={legendMin}
            maxValue={legendMax}
            mode={analyticsMode}
            formatValue={legendFormatValue}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DOM helper for heatmap badge (not React — used by overlays.add)
// ---------------------------------------------------------------------------

function createHeatmapBadge(label: string, color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    background: ${color};
    color: #fff;
    pointer-events: none;
  `;
  el.textContent = label;
  return el;
}
