import { useEffect, useRef, useState } from "react";
import { Responsive, verticalCompactor, type Layout, type ResponsiveLayouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { useLayoutPersistence } from "../../hooks/useLayoutPersistence";
import { KpiInstances } from "../widgets/KpiInstances";
import { KpiCycleTime } from "../widgets/KpiCycleTime";
import { KpiSla } from "../widgets/KpiSla";
import { AdoptionChart } from "../widgets/AdoptionChart";
import { ProcessListTable } from "../widgets/ProcessListTable";
import { TaskStatsWidget } from "../widgets/TaskStatsWidget";
import { CalendarHeatmap } from "../widgets/CalendarHeatmap";
import styles from "./CockpitLayout.module.css";

// ---------------------------------------------------------------------------
// Grid configuration (D-37, Research Pattern 5)
// ---------------------------------------------------------------------------

const BREAKPOINTS = { lg: 1024, md: 768, sm: 480, xs: 0 } as const;
const COLS = { lg: 24, md: 12, sm: 6, xs: 4 } as const;
const ROW_HEIGHT = 30;

/**
 * Default widget layouts for all breakpoints.
 * lg: desktop (24 cols), md: tablet (12 cols), sm: small tablet (6 cols), xs: mobile (4 cols).
 */
const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "kpi-instances", x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
    { i: "kpi-cycle-time", x: 8, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
    { i: "kpi-sla", x: 16, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
    { i: "adoption-chart", x: 0, y: 5, w: 24, h: 7, minW: 12, minH: 5 },
    { i: "process-list", x: 0, y: 12, w: 16, h: 13, minW: 10, minH: 8 },
    { i: "task-stats", x: 16, y: 12, w: 8, h: 7, minW: 6, minH: 5 },
    { i: "calendar-heatmap", x: 16, y: 19, w: 8, h: 6, minW: 6, minH: 4 },
  ],
  md: [
    { i: "kpi-instances", x: 0, y: 0, w: 6, h: 4 },
    { i: "kpi-cycle-time", x: 6, y: 0, w: 6, h: 4 },
    { i: "kpi-sla", x: 0, y: 4, w: 6, h: 4 },
    { i: "adoption-chart", x: 0, y: 8, w: 12, h: 7 },
    { i: "process-list", x: 0, y: 15, w: 12, h: 12 },
    { i: "task-stats", x: 0, y: 27, w: 12, h: 10 },
    { i: "calendar-heatmap", x: 0, y: 37, w: 12, h: 5 },
  ],
  sm: [
    { i: "kpi-instances", x: 0, y: 0, w: 6, h: 4 },
    { i: "kpi-cycle-time", x: 0, y: 4, w: 6, h: 4 },
    { i: "kpi-sla", x: 0, y: 8, w: 6, h: 4 },
    { i: "adoption-chart", x: 0, y: 12, w: 6, h: 6 },
    { i: "process-list", x: 0, y: 18, w: 6, h: 12 },
    { i: "task-stats", x: 0, y: 30, w: 6, h: 10 },
    { i: "calendar-heatmap", x: 0, y: 40, w: 6, h: 5 },
  ],
  xs: [
    { i: "kpi-instances", x: 0, y: 0, w: 4, h: 4 },
    { i: "kpi-cycle-time", x: 0, y: 4, w: 4, h: 4 },
    { i: "kpi-sla", x: 0, y: 8, w: 4, h: 4 },
    { i: "adoption-chart", x: 0, y: 12, w: 4, h: 6 },
    { i: "process-list", x: 0, y: 18, w: 4, h: 12 },
    { i: "task-stats", x: 0, y: 30, w: 4, h: 10 },
    { i: "calendar-heatmap", x: 0, y: 40, w: 4, h: 5 },
  ],
};

// ---------------------------------------------------------------------------
// CockpitLayout
// ---------------------------------------------------------------------------

/**
 * Main dashboard layout using react-grid-layout Responsive component.
 * Uses ResizeObserver for explicit width measurement instead of WidthProvider HOC
 * (per Pitfall 2 from research).
 * Layout persistence via MetaViewCustom REST endpoints (D-35, D-36).
 */
export function CockpitLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { layouts, saveLayouts, isLoaded } =
    useLayoutPersistence(DEFAULT_LAYOUTS);

  // ResizeObserver for explicit width (NOT WidthProvider)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      {width > 0 && isLoaded && layouts && (
        <Responsive
          className={styles.grid}
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={width}
          onLayoutChange={(_currentLayout: Layout, allLayouts: ResponsiveLayouts) =>
            saveLayouts(allLayouts)
          }
          dragConfig={{ enabled: true, handle: ".ck-drag-handle" }}
          resizeConfig={{ enabled: true }}
          compactor={verticalCompactor}
        >
          <div key="kpi-instances" className={styles.widgetSlot}>
            <KpiInstances />
          </div>
          <div key="kpi-cycle-time" className={styles.widgetSlot}>
            <KpiCycleTime />
          </div>
          <div key="kpi-sla" className={styles.widgetSlot}>
            <KpiSla />
          </div>
          <div key="adoption-chart" className={styles.widgetSlot}>
            <AdoptionChart />
          </div>
          <div key="process-list" className={styles.widgetSlot}>
            <ProcessListTable />
          </div>
          <div key="task-stats" className={styles.widgetSlot}>
            <TaskStatsWidget />
          </div>
          <div key="calendar-heatmap" className={styles.widgetSlot}>
            <CalendarHeatmap />
          </div>
        </Responsive>
      )}
    </div>
  );
}
