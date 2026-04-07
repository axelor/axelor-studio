/**
 * Duration boxplot chart per BPMN node (PERF-02, D-02).
 *
 * Vertical boxplot showing P25-P75 box, median line, min/max whiskers
 * for each activity node. Click on a box sets selectedAnalyticsNodeId
 * in the cockpit store for cross-chart drill-down.
 *
 * Follows the AdoptionChart pattern: buildOptions() + MutationObserver dark mode.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, resolveChartPalette } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useAnalyticsDuration } from "../../hooks/useAnalyticsDuration";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { useCockpitStore } from "../../stores/useCockpitStore";
import { axelorBridge } from "@studio/shared/bridge";
import type { AnalyticsNodeDuration } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./DurationBoxplot.module.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format milliseconds into a human-readable duration. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

// ---------------------------------------------------------------------------
// Build ECharts options
// ---------------------------------------------------------------------------

function buildOptions(
  nodes: AnalyticsNodeDuration[],
  _palette: string[],
): EChartsOption {
  // Approximate P25/P75 from available percentiles:
  // P25 ~ midpoint(min, P50),  P75 ~ midpoint(P50, max)
  const boxData = nodes.map((d) => [
    d.minDuration,
    Math.round((d.minDuration + d.p50) / 2),
    d.p50,
    Math.round((d.p50 + d.maxDuration) / 2),
    d.maxDuration,
  ]);

  const nodeNames = nodes.map((d) => d.activityName ?? d.activityId);

  // Resolve CSS custom properties for boxplot colours
  const cs = getComputedStyle(document.documentElement);
  const boxplotFill = cs.getPropertyValue("--ck-boxplot-fill").trim();
  const boxplotStroke = cs.getPropertyValue("--ck-boxplot-stroke").trim();

  return {
    tooltip: {
      trigger: "item",
      confine: true,
      formatter(params: unknown) {
        const p = params as { dataIndex: number };
        const node = nodes[p.dataIndex];
        if (!node) return "";
        return [
          `<b>${node.activityName ?? node.activityId}</b>`,
          `P50: ${formatDuration(node.p50)}`,
          `P95: ${formatDuration(node.p95)}`,
          `P99: ${formatDuration(node.p99)}`,
          `Min: ${formatDuration(node.minDuration)}`,
          `Max: ${formatDuration(node.maxDuration)}`,
          `Avg: ${formatDuration(node.avgDuration)}`,
          `Executions: ${node.passCount}`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "category",
      data: nodeNames,
      axisLabel: {
        rotate: nodeNames.length > 6 ? 45 : 0,
        fontSize: 12,
      },
    },
    yAxis: {
      type: "value",
      name: "Duration (ms)",
      axisLabel: {
        fontSize: 12,
        formatter: (v: number) => formatDuration(v),
      },
    },
    series: [
      {
        type: "boxplot",
        data: boxData,
        itemStyle: {
          color: boxplotFill || "rgba(100,150,220,0.3)",
          borderColor: boxplotStroke || "#5470c6",
        },
        emphasis: {
          itemStyle: {
            borderColor: cs.getPropertyValue("--ck-accent").trim() || "#3b82f6",
          },
        },
      },
    ],
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: nodeNames.length > 6 ? 80 : 40,
    },
    animationDuration: 800,
    animationEasing: "cubicOut",
    animationDurationUpdate: 400,
    animationEasingUpdate: "cubicInOut",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DurationBoxplotProps {
  processDefinitionKey: string;
  onChartReady?: (instance: { group: string }) => void;
}

/**
 * Vertical boxplot per activity node — click drills into node analytics.
 */
export function DurationBoxplot({
  processDefinitionKey,
  onChartReady,
}: DurationBoxplotProps) {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAnalyticsDuration(
    processDefinitionKey,
    period,
  );
  const selectAnalyticsNode = useCockpitStore((s) => s.selectAnalyticsNode);
  const [palette, setPalette] = useState<string[]>([]);

  // Resolve palette on mount and theme changes
  const refreshPalette = useCallback(() => {
    setPalette(resolveChartPalette());
  }, []);

  useEffect(() => {
    refreshPalette();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-bs-theme"
        ) {
          refreshPalette();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });

    return () => observer.disconnect();
  }, [refreshPalette]);

  const nodes = data?.nodes ?? [];

  const options = useMemo(() => {
    if (nodes.length === 0 || palette.length === 0) return {};
    return buildOptions(nodes, palette);
  }, [nodes, palette]);

  const onEvents = useMemo(
    () => ({
      click: (params: { dataIndex: number }) => {
        const node = nodes[params.dataIndex];
        if (node) selectAnalyticsNode(node.activityId);
      },
    }),
    [nodes, selectAnalyticsNode],
  );

  const handleChartReady = useCallback(
    (instance: { group: string }) => {
      instance.group = "analytics";
      onChartReady?.(instance);
    },
    [onChartReady],
  );

  return (
    <WidgetShell
      title={axelorBridge.translate("Duration Distribution")}
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.chart} data-testid="duration-boxplot">
        <ReactECharts
          echarts={echarts}
          option={options}
          onEvents={onEvents}
          onChartReady={handleChartReady}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </WidgetShell>
  );
}
