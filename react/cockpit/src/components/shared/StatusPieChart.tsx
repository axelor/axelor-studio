import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../echarts-setup";
import type { StatusCount } from "../../api/types";
import type { EChartsOption } from "echarts";

interface StatusPieChartProps {
  data: StatusCount[];
}

/** Map raw status strings to human-readable labels. */
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Running",
  COMPLETED: "Completed",
  INTERNALLY_TERMINATED: "Failed",
  SUSPENDED: "Suspended",
};

/** CSS custom property names for semantic status palette. */
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "--bs-primary",
  COMPLETED: "--bs-success",
  INTERNALLY_TERMINATED: "--bs-danger",
  SUSPENDED: "--bs-warning",
};

/**
 * Resolve semantic palette from computed CSS custom properties.
 */
function resolveSemanticPalette(
  statuses: string[],
): { colors: string[]; fallback: boolean } {
  if (typeof document === "undefined") {
    return { colors: [], fallback: true };
  }
  const style = getComputedStyle(document.documentElement);
  const colors = statuses.map((s) => {
    const prop = STATUS_COLORS[s];
    if (!prop) return "#999";
    return style.getPropertyValue(prop).trim() || "#999";
  });
  return { colors, fallback: false };
}

/**
 * ECharts donut pie chart for instance status breakdown (D-33).
 *
 * Uses semantic palette resolved from Bootstrap CSS variables.
 */
export function StatusPieChart({ data }: StatusPieChartProps) {
  const [palette, setPalette] = useState<string[]>([]);

  const statuses = useMemo(() => data.map((d) => d.status), [data]);

  useEffect(() => {
    const { colors } = resolveSemanticPalette(statuses);
    setPalette(colors);
  }, [statuses]);

  const options: EChartsOption = useMemo(() => {
    if (palette.length === 0 || data.length === 0) return {};

    return {
      color: palette,
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        bottom: 0,
        show: true,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
      grid: { containLabel: true },
      series: [
        {
          type: "pie",
          radius: ["38%", "64%"],
          center: ["50%", "45%"],
          data: data.map((d, i) => ({
            name: STATUS_LABELS[d.status] ?? d.status,
            value: d.count,
            itemStyle: { color: palette[i] },
          })),
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 600,
              formatter: "{b}\n{c}",
            },
          },
        },
      ],
      animationDuration: 800,
      animationEasing: "cubicOut",
    };
  }, [data, palette]);

  return (
    <div data-testid="status-pie-chart" style={{ flex: 1, minHeight: 0 }}>
      <ReactECharts
        echarts={echarts}
        option={options}
        notMerge
        lazyUpdate
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
