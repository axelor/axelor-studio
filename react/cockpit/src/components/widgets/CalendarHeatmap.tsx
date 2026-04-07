import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useCalendarHeatmap } from "../../hooks/useCalendarHeatmap";
import { axelorBridge } from "@studio/shared/bridge";
import type { CalendarHeatmapEntry } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./CalendarHeatmap.module.css";

/**
 * Build ECharts calendar heatmap options from daily activity entries.
 */
function buildOptions(
  entries: CalendarHeatmapEntry[],
  calColors: string[],
): EChartsOption {
  const data = entries.map((e) => [e.date, e.count]);
  const counts = entries.map((e) => e.count);
  const maxCount = Math.max(...counts, 1);

  // Compute date range (90 days from latest entry or today)
  const endDate =
    entries.length > 0
      ? entries[entries.length - 1].date
      : new Date().toISOString().slice(0, 10);
  const startDate =
    entries.length > 0
      ? entries[0].date
      : new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  return {
    tooltip: {
      formatter(params: { value: [string, number] }) {
        return `${params.value[0]}: ${params.value[1]} instances`;
      },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      show: false,
      inRange: { color: calColors },
    },
    calendar: {
      range: [startDate, endDate],
      cellSize: [12, 12],
      itemStyle: {
        borderWidth: 2,
        borderColor: "var(--bs-body-bg)",
      },
      dayLabel: { show: false },
      monthLabel: { fontSize: 10 },
      yearLabel: { show: false },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data,
      },
    ],
    animationDuration: 600,
    animationEasing: "cubicOut",
  };
}

/**
 * Resolve --ck-cal-* 5-stop palette from CSS custom properties.
 */
function resolveCalendarPalette(): string[] {
  const cs = getComputedStyle(document.documentElement);
  return [
    cs.getPropertyValue("--ck-cal-empty").trim(),
    cs.getPropertyValue("--ck-cal-low").trim(),
    cs.getPropertyValue("--ck-cal-mid").trim(),
    cs.getPropertyValue("--ck-cal-high").trim(),
    cs.getPropertyValue("--ck-cal-max").trim(),
  ];
}

/**
 * GitHub-style daily activity calendar heatmap (D-07).
 *
 * Uses ECharts HeatmapChart + CalendarComponent with 5-stop --ck-cal-* palette.
 * Re-resolves palette on Bootstrap theme change (data-bs-theme MutationObserver).
 */
export function CalendarHeatmap({ period }: { period?: string }) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useCalendarHeatmap(period ?? "90d");
  const [calColors, setCalColors] = useState<string[]>([]);

  // Resolve palette on mount and theme changes
  const refreshPalette = useCallback(() => {
    setCalColors(resolveCalendarPalette());
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
    if (!data?.entries || calColors.length === 0) return {};
    return buildOptions(data.entries, calColors);
  }, [data, calColors]);

  return (
    <WidgetShell
      title={axelorBridge.translate("Daily Activity")}
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.container} data-testid="calendar-heatmap">
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
