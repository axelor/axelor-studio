/**
 * Sankey flow diagram for node-to-node transitions (D-18).
 *
 * Visualises process instance flow between BPMN activities using an ECharts
 * Sankey chart. Link curveness 0.5, hover highlight, click-to-select node.
 *
 * Follows the AdoptionChart pattern: buildOptions() + MutationObserver dark mode.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { echarts, resolveChartPalette } from "../../echarts-setup";
import { WidgetShell } from "../shared/WidgetShell";
import { useAnalyticsSankey } from "../../hooks/useAnalyticsSankey";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { useCockpitStore } from "../../stores/useCockpitStore";
import { axelorBridge } from "@studio/shared/bridge";
import type { SankeyDataResponse } from "../../api/types";
import type { EChartsOption } from "echarts";
import styles from "./SankeyFlow.module.css";

// ---------------------------------------------------------------------------
// Build ECharts options
// ---------------------------------------------------------------------------

function buildOptions(
  data: SankeyDataResponse,
  _palette: string[],
): EChartsOption {
  const cs = getComputedStyle(document.documentElement);
  const sankeyNode =
    cs.getPropertyValue("--ck-sankey-node").trim() || "#3b82f6";
  const sankeyLink =
    cs.getPropertyValue("--ck-sankey-link").trim() || "rgba(100,150,220,0.25)";
  const sankeyLinkHover =
    cs.getPropertyValue("--ck-sankey-link-hover").trim() ||
    "rgba(100,150,220,0.50)";

  return {
    tooltip: { trigger: "item", confine: true },
    series: [
      {
        type: "sankey",
        data: data.nodes.map((n) => ({
          name: n.name,
          itemStyle: { color: sankeyNode },
        })),
        links: data.links.map((l) => ({
          source: l.source,
          target: l.target,
          value: l.value,
        })),
        nodeWidth: 20,
        nodeGap: 12,
        layoutIterations: 32,
        lineStyle: {
          color: sankeyLink,
          curveness: 0.5,
          opacity: 0.6,
        },
        emphasis: {
          lineStyle: { color: sankeyLinkHover, opacity: 0.8 },
        },
        label: {
          show: true,
          fontSize: 12,
          formatter(params: unknown) {
            const p = params as { data?: { name?: string } };
            const nodeName = p.data?.name;
            if (!nodeName) return "";
            const node = data.nodes.find((n) => n.name === nodeName);
            return node?.displayName ?? nodeName;
          },
        },
      },
    ],
    animationDuration: 800,
    animationEasing: "cubicOut",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SankeyFlowProps {
  processDefinitionKey: string;
  onChartReady?: (instance: { group: string }) => void;
}

/**
 * Sankey transition diagram — click a node to drill-down in analytics.
 */
export function SankeyFlow({
  processDefinitionKey,
  onChartReady,
}: SankeyFlowProps) {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAnalyticsSankey(
    processDefinitionKey,
    period,
  );
  const selectAnalyticsNode = useCockpitStore((s) => s.selectAnalyticsNode);
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

  const onEvents = useMemo(
    () => ({
      click: (params: { data?: { name?: string } }) => {
        const name = params.data?.name;
        if (name) selectAnalyticsNode(name);
      },
    }),
    [selectAnalyticsNode],
  );

  const handleChartReady = useCallback(
    (instance: { group: string }) => {
      instance.group = "analytics";
      onChartReady?.(instance);
    },
    [onChartReady],
  );

  return (
    <WidgetShell
      title={axelorBridge.translate("Branch Flow")}
      isLoading={isLoading}
      error={error ?? null}
      onRetry={() => void refetch()}
    >
      <div className={styles.chart} data-testid="sankey-flow">
        <ReactECharts
          echarts={echarts}
          option={options}
          onEvents={onEvents}
          onChartReady={handleChartReady}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </WidgetShell>
  );
}
