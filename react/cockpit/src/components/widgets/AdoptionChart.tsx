import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, resolveChartPalette } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useAdoptionOverview } from "../../hooks/useAdoptionOverview";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import type { MonthlyProcessCount } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./AdoptionChart.module.css";

/**
 * Build ECharts stacked bar options from monthly process counts.
 */
function buildOptions(
  monthlyCounts: MonthlyProcessCount[],
  palette: string[],
): EChartsOption {
  // Unique sorted months for x-axis
  const months = [...new Set(monthlyCounts.map((m) => m.month))].sort();

  // Unique process names for series
  const processNames = [...new Set(monthlyCounts.map((m) => m.processName))];

  // Build lookup: { processName: { month: count } }
  const lookup = new Map<string, Map<string, number>>();
  for (const mc of monthlyCounts) {
    if (!lookup.has(mc.processName)) {
      lookup.set(mc.processName, new Map());
    }
    lookup.get(mc.processName)!.set(mc.month, mc.count);
  }

  const series = processNames.map((name) => {
    const monthMap = lookup.get(name)!;
    return {
      name,
      type: "bar" as const,
      stack: "total",
      data: months.map((m) => monthMap.get(m) ?? 0),
    };
  });

  return {
    color: palette,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: { color: "#374151", fontSize: 12 },
      confine: true,
    },
    legend: {
      bottom: 0,
      data: processNames,
      textStyle: { fontSize: 11 },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: 12,
      right: 12,
      top: 12,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: months,
      axisLabel: { fontSize: 11, color: "#6b7280" },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { fontSize: 11, color: "#6b7280" },
      splitLine: { lineStyle: { color: "#f3f4f6" } },
    },
    series,
    animationDuration: 800,
    animationEasing: "cubicOut",
    animationDurationUpdate: 400,
    animationEasingUpdate: "cubicInOut",
  };
}

/**
 * ECharts stacked bar chart for adoption overview (D-17, D-19).
 *
 * Resolves categorical palette from CSS tokens via resolveChartPalette().
 * Re-resolves palette on Bootstrap theme change (data-bs-theme mutation).
 */
export function AdoptionChart() {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAdoptionOverview(period);
  const [palette, setPalette] = useState<string[]>([]);

  // Resolve palette on mount and theme changes
  const refreshPalette = useCallback(() => {
    setPalette(resolveChartPalette());
  }, []);

  useEffect(() => {
    refreshPalette();

    // Watch for Bootstrap theme toggle (data-bs-theme attribute)
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
    if (!data?.monthlyCounts || palette.length === 0) return {};
    return buildOptions(data.monthlyCounts, palette);
  }, [data, palette]);

  return (
    <WidgetShell
      title="Adoption Overview"
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.chart} data-testid="adoption-chart">
        <ReactECharts
          echarts={echarts}
          option={options}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </WidgetShell>
  );
}
