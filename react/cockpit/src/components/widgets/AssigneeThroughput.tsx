/**
 * Assignee throughput horizontal bar chart (PERF-04, D-19).
 *
 * Horizontal bars sorted by task count (highest at top). Shows empty state
 * when no user tasks exist in the selected period.
 *
 * Follows the AdoptionChart pattern: buildOptions() + MutationObserver dark mode.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, resolveChartPalette } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useAnalyticsThroughput } from "../../hooks/useAnalyticsThroughput";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { axelorBridge } from "@studio/shared/bridge";
import type { AssigneeThroughputEntry } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./AssigneeThroughput.module.css";

// ---------------------------------------------------------------------------
// Build ECharts options
// ---------------------------------------------------------------------------

function buildOptions(
  data: AssigneeThroughputEntry[],
  palette: string[],
): EChartsOption {
  // Sort by taskCount descending
  const sorted = [...data].sort((a, b) => b.taskCount - a.taskCount);

  return {
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "shadow" },
    },
    xAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "category",
      data: sorted.map((e) => e.assignee),
      axisLabel: { fontSize: 12 },
      inverse: true, // highest at top
    },
    series: [
      {
        type: "bar",
        data: sorted.map((e, i) => ({
          value: e.taskCount,
          itemStyle: { color: palette[i % palette.length] },
        })),
      },
    ],
    grid: { left: 100, right: 20, top: 10, bottom: 20 },
    animationDuration: 800,
    animationEasing: "cubicOut",
  };
}

// ---------------------------------------------------------------------------
// Empty state SVG
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className={styles.empty}>
      <svg
        className={styles.emptyIcon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="24" cy="14" r="8" fill="currentColor" opacity="0.3" />
        <path
          d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        <rect x="30" y="32" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
        <rect x="30" y="37" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="30" y="42" width="4" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
      </svg>
      <span>{axelorBridge.translate("No user tasks in this period")}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AssigneeThroughputProps {
  processDefinitionKey: string;
  onChartReady?: (instance: { group: string }) => void;
}

/**
 * Horizontal bar chart showing tasks per assignee, sorted by count.
 */
export function AssigneeThroughput({
  processDefinitionKey,
  onChartReady,
}: AssigneeThroughputProps) {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAnalyticsThroughput(
    processDefinitionKey,
    period,
  );
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

  const entries = data?.entries ?? [];

  const options = useMemo(() => {
    if (entries.length === 0 || palette.length === 0) return {};
    return buildOptions(entries, palette);
  }, [entries, palette]);

  const handleChartReady = useCallback(
    (instance: { group: string }) => {
      instance.group = "analytics";
      onChartReady?.(instance);
    },
    [onChartReady],
  );

  // Empty state when no data and not loading
  const showEmpty = !isLoading && !error && entries.length === 0;

  return (
    <WidgetShell
      title={axelorBridge.translate("Assignee Throughput")}
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className={styles.chart} data-testid="assignee-throughput">
          <ReactECharts
            echarts={echarts}
            option={options}
            onChartReady={handleChartReady}
            notMerge
            lazyUpdate
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      )}
    </WidgetShell>
  );
}
