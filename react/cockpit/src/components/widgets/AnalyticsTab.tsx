/**
 * Analytics Tab — CSS Grid layout shell with echarts group registration (D-09).
 *
 * Manages echarts.connect('analytics') lifecycle so all chart widgets
 * in the analytics tab share cross-highlight and cross-tooltip interactions.
 *
 * Grid layout follows UI-SPEC inverted pyramid density:
 * Row 1: FilterChipsBar (full width)
 * Row 2: AnalyticsDiagram 65% + NodeDetailPanel 35%
 * Row 3: DurationBoxplot 60% + SankeyFlow 40%
 * Row 4: StatusTrendChart + AssigneeThroughput (1fr each)
 * Row 5: DurationTable (full width)
 *
 * Widget placeholders will be replaced in Plans 04-06.
 */

import { useCallback, useEffect, useMemo } from "react";

import { echarts } from "../../echarts-setup";
import { useCockpitStore } from "../../stores/useCockpitStore";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { useAnalyticsDuration } from "../../hooks/useAnalyticsDuration";
import { FilterChipsBar } from "../shared/FilterChipsBar";
import { AnalyticsDiagram } from "./AnalyticsDiagram";
import { DurationBoxplot } from "./DurationBoxplot";
import { SankeyFlow } from "./SankeyFlow";
import { StatusTrendChart } from "./StatusTrendChart";
import { AssigneeThroughput } from "./AssigneeThroughput";
import { DurationTable } from "./DurationTable";
import { NodeDetailPanel } from "./NodeDetailPanel";

import styles from "./AnalyticsTab.module.css";

interface AnalyticsTabProps {
  processId: number;
  processDefinitionKey: string;
}

export function AnalyticsTab({ processId, processDefinitionKey }: AnalyticsTabProps) {
  const { period } = usePeriodFilter();
  const selectedNodeId = useCockpitStore((s) => s.selectedAnalyticsNodeId);
  const selectAnalyticsNode = useCockpitStore((s) => s.selectAnalyticsNode);
  const { data: durationData } = useAnalyticsDuration(processDefinitionKey, period);

  const aggregateStats = useMemo(() => {
    if (!selectedNodeId || !durationData?.nodes) return null;
    return durationData.nodes.find((n) => n.activityId === selectedNodeId) ?? null;
  }, [selectedNodeId, durationData]);

  // Register/unregister echarts group for cross-chart interactions (D-09)
  useEffect(() => {
    echarts.connect("analytics");
    return () => {
      echarts.disconnect("analytics");
    };
  }, []);

  /** Callback to assign a chart instance to the analytics group. */
  const handleChartReady = useCallback((instance: { group: string }) => {
    instance.group = "analytics";
  }, []);

  return (
    <div className={styles.analyticsGrid}>
      <div className={styles.filterRow}>
        <FilterChipsBar />
      </div>

      <div className={styles.diagramRow}>
        <div className={styles.diagram}>
          <AnalyticsDiagram processId={processId} processDefinitionKey={processDefinitionKey} />
        </div>
        <div className={styles.nodePanel}>
          {selectedNodeId && (
            <NodeDetailPanel
              isOpen={!!selectedNodeId}
              onClose={() => selectAnalyticsNode(null)}
              processInstanceId=""
              activityId={selectedNodeId}
              processDefinitionKey={processDefinitionKey}
              aggregateStats={aggregateStats}
            />
          )}
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.boxplot}>
          <DurationBoxplot processDefinitionKey={processDefinitionKey} onChartReady={handleChartReady} />
        </div>
        <div className={styles.sankey}>
          <SankeyFlow processDefinitionKey={processDefinitionKey} onChartReady={handleChartReady} />
        </div>
      </div>

      <div className={styles.trendRow}>
        <div className={styles.statusTrend}>
          <StatusTrendChart processDefinitionKey={processDefinitionKey} onChartReady={handleChartReady} />
        </div>
        <div className={styles.throughput}>
          <AssigneeThroughput processDefinitionKey={processDefinitionKey} onChartReady={handleChartReady} />
        </div>
      </div>

      <div className={styles.tableRow}>
        <DurationTable processDefinitionKey={processDefinitionKey} />
      </div>
    </div>
  );
}
