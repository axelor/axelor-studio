import { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts } from "../../echarts-setup";
import type { EChartsOption } from "echarts";
import styles from "./SparklineChart.module.css";

interface SparklineChartProps {
  data: number[];
}

/**
 * 60x20px inline ECharts mini chart for KPI trend display (D-07).
 *
 * No axis, no tooltip, no grid visible. Single smooth line with
 * area fill at 10% accent opacity. Designed for 7-day trend data.
 */
export function SparklineChart({ data }: SparklineChartProps) {
  const options = useMemo((): EChartsOption => {
    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue("--ck-accent").trim();

    return {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: "category",
        show: false,
        data: data.map((_, i) => i),
      },
      yAxis: { type: "value", show: false },
      series: [
        {
          type: "line",
          data,
          smooth: true,
          symbol: "none",
          lineStyle: { color: accent, width: 1.5 },
          areaStyle: { color: accent, opacity: 0.1 },
        },
      ],
      animation: true,
      animationDuration: 600,
      animationEasing: "cubicOut",
      animationDelay: 200,
    };
  }, [data]);

  return (
    <div className={styles.sparkline}>
      <ReactECharts
        echarts={echarts}
        option={options}
        notMerge
        lazyUpdate
        style={{ width: 60, height: 20 }}
      />
    </div>
  );
}
