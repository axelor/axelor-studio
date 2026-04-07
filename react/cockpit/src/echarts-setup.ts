import * as echarts from "echarts/core";
import { BarChart, PieChart, GaugeChart, LineChart } from "echarts/charts";
import {
  HeatmapChart,
  SankeyChart,
  BoxplotChart,
  CustomChart,
  FunnelChart,
  ParallelChart,
  RadarChart,
  ThemeRiverChart,
  ScatterChart,
} from "echarts/charts";
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
  GraphicComponent,
  TitleComponent,
} from "echarts/components";
import {
  VisualMapComponent,
  CalendarComponent,
  ParallelComponent,
  RadarComponent,
  MarkLineComponent,
  MarkPointComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
} from "echarts/components";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  PieChart,
  GaugeChart,
  LineChart,
  HeatmapChart,
  SankeyChart,
  BoxplotChart,
  CustomChart,
  FunnelChart,
  ParallelChart,
  RadarChart,
  ThemeRiverChart,
  ScatterChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  GraphicComponent,
  TitleComponent,
  VisualMapComponent,
  CalendarComponent,
  ParallelComponent,
  RadarComponent,
  MarkLineComponent,
  MarkPointComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  LabelLayout,
  CanvasRenderer,
]);

export { echarts };

/**
 * Resolve cockpit chart palette from CSS custom properties.
 * Returns an array of 6 colour strings for ECharts categorical series.
 */
export function resolveChartPalette(): string[] {
  const style = getComputedStyle(document.documentElement);
  return Array.from({ length: 6 }, (_, i) =>
    style.getPropertyValue(`--ck-chart-${i + 1}`).trim(),
  );
}
