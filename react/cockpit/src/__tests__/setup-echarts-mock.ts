import { vi } from "vitest";

// Mock echarts/core so chart components render without canvas
vi.mock("echarts/core", () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getWidth: vi.fn(() => 400),
    getHeight: vi.fn(() => 300),
    group: "",
  })),
  use: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("echarts/charts", () => ({
  BarChart: {},
  PieChart: {},
  GaugeChart: {},
  LineChart: {},
  HeatmapChart: {},
  SankeyChart: {},
  BoxplotChart: {},
  CustomChart: {},
  FunnelChart: {},
  ParallelChart: {},
  RadarChart: {},
  ThemeRiverChart: {},
  ScatterChart: {},
}));
vi.mock("echarts/components", () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  GraphicComponent: {},
  TitleComponent: {},
  VisualMapComponent: {},
  CalendarComponent: {},
  ParallelComponent: {},
  RadarComponent: {},
  MarkLineComponent: {},
  MarkPointComponent: {},
  DataZoomComponent: {},
  BrushComponent: {},
  ToolboxComponent: {},
}));
vi.mock("echarts/features", () => ({ LabelLayout: {} }));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));
