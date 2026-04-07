/**
 * Status trend multi-line chart (PERF-03, D-16, D-22).
 *
 * Three lines (Running, Completed, Failed) with a DataZoom slider at the bottom.
 * Colours resolved from Bootstrap CSS variables for theme consistency.
 *
 * Follows the AdoptionChart pattern: buildOptions() + MutationObserver dark mode.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, resolveChartPalette } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useAnalyticsStatusTrend } from "../../hooks/useAnalyticsStatusTrend";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { axelorBridge } from "@studio/shared/bridge";
import type { StatusTrendResponse } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./StatusTrendChart.module.css";

// ---------------------------------------------------------------------------
// Build ECharts options
// ---------------------------------------------------------------------------

function buildOptions(
  data: StatusTrendResponse,
  _palette: string[],
): EChartsOption {
  const cs = getComputedStyle(document.documentElement);
  const successColor = cs.getPropertyValue("--bs-success").trim() || "#198754";
  const dangerColor = cs.getPropertyValue("--bs-danger").trim() || "#dc3545";
  const accentColor =
    cs.getPropertyValue("--ck-accent").trim() || "#3b82f6";

  return {
    tooltip: { trigger: "axis", confine: true },
    legend: {
      data: ["Running", "Completed", "Failed"],
      top: 0,
      right: 0,
      textStyle: { fontSize: 12 },
    },
    xAxis: {
      type: "category",
      data: data.points.map((p) => p.timeBucket),
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        name: "Running",
        type: "line",
        smooth: true,
        data: data.points.map((p) => p.running),
        lineStyle: { color: accentColor },
        itemStyle: { color: accentColor },
      },
      {
        name: "Completed",
        type: "line",
        smooth: true,
        data: data.points.map((p) => p.completed),
        lineStyle: { color: successColor },
        itemStyle: { color: successColor },
      },
      {
        name: "Failed",
        type: "line",
        smooth: true,
        data: data.points.map((p) => p.failed),
        lineStyle: { color: dangerColor },
        itemStyle: { color: dangerColor },
      },
    ],
    dataZoom: [
      {
        type: "slider",
        height: 24,
        bottom: 0,
        borderColor: "transparent",
      },
    ],
    grid: { left: 50, right: 20, top: 30, bottom: 40 },
    animationDuration: 800,
    animationEasing: "cubicOut",
    animationDurationUpdate: 400,
    animationEasingUpdate: "cubicInOut",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatusTrendChartProps {
  processDefinitionKey: string;
  onChartReady?: (instance: { group: string }) => void;
}

/**
 * Multi-line trend chart with DataZoom slider — Running / Completed / Failed.
 */
export function StatusTrendChart({
  processDefinitionKey,
  onChartReady,
}: StatusTrendChartProps) {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAnalyticsStatusTrend(
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

  const options = useMemo(() => {
    if (!data || palette.length === 0) return {};
    return buildOptions(data, palette);
  }, [data, palette]);

  const handleChartReady = useCallback(
    (instance: { group: string }) => {
      instance.group = "analytics";
      onChartReady?.(instance);
    },
    [onChartReady],
  );

  return (
    <WidgetShell
      title={axelorBridge.translate("Status Trend")}
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.chart} data-testid="status-trend-chart">
        <ReactECharts
          echarts={echarts}
          option={options}
          onChartReady={handleChartReady}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </WidgetShell>
  );
}
