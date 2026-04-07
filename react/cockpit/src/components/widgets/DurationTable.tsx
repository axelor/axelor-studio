/**
 * Sortable duration table with percentile columns (D-17, PERF-02).
 *
 * 10 columns: Node, Total, Work, Idle, Avg, Min, Max, P50, P95, P99.
 * Default sort: descending by Avg (bottleneck identification).
 * Row click sets selectedAnalyticsNodeId for cross-widget drill-down.
 * Uses PaginationBar when > 20 rows.
 */

import { useState, useMemo } from "react";

import { axelorBridge } from "@studio/shared/bridge";

import { useCockpitStore } from "../../stores/useCockpitStore";
import { usePeriodFilter } from "../../hooks/usePeriodFilter";
import { useAnalyticsDuration } from "../../hooks/useAnalyticsDuration";
import { formatDuration } from "../../utils/format";
import { WidgetShell } from "../shared/WidgetShell";
import { PaginationBar } from "../shared/PaginationBar";

import type { AnalyticsNodeDuration } from "../../api/types";

import styles from "./DurationTable.module.css";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

type SortableColumn =
  | "activityName"
  | "totalDuration"
  | "workDuration"
  | "idleDuration"
  | "avgDuration"
  | "minDuration"
  | "maxDuration"
  | "p50"
  | "p95"
  | "p99";

const COLUMNS: ReadonlyArray<{ key: SortableColumn; labelKey: string }> = [
  { key: "activityName", labelKey: "Node" },
  { key: "totalDuration", labelKey: "Total" },
  { key: "workDuration", labelKey: "Work" },
  { key: "idleDuration", labelKey: "Idle" },
  { key: "avgDuration", labelKey: "Avg" },
  { key: "minDuration", labelKey: "Min" },
  { key: "maxDuration", labelKey: "Max" },
  { key: "p50", labelKey: "P50" },
  { key: "p95", labelKey: "P95" },
  { key: "p99", labelKey: "P99" },
];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Sort indicator
// ---------------------------------------------------------------------------

function SortIndicator({ direction }: { direction: "asc" | "desc" }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      className={styles.sortIcon}
      aria-hidden="true"
    >
      <path
        d={direction === "asc" ? "M4 1L7 6H1Z" : "M4 7L1 2H7Z"}
        fill="currentColor"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

function compareNodes(
  a: AnalyticsNodeDuration,
  b: AnalyticsNodeDuration,
  column: SortableColumn,
  direction: "asc" | "desc",
): number {
  let result: number;
  if (column === "activityName") {
    const nameA = (a.activityName ?? a.activityId).toLowerCase();
    const nameB = (b.activityName ?? b.activityId).toLowerCase();
    result = nameA.localeCompare(nameB);
  } else {
    result = a[column] - b[column];
  }
  return direction === "asc" ? result : -result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DurationTableProps {
  processDefinitionKey: string;
}

export function DurationTable({ processDefinitionKey }: DurationTableProps) {
  const { period } = usePeriodFilter();
  const { data, isLoading, error, refetch } = useAnalyticsDuration(
    processDefinitionKey,
    period,
  );

  const selectedAnalyticsNodeId = useCockpitStore(
    (s) => s.selectedAnalyticsNodeId,
  );
  const selectAnalyticsNode = useCockpitStore(
    (s) => s.selectAnalyticsNode,
  );

  const [sortColumn, setSortColumn] = useState<SortableColumn>("avgDuration");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    "desc",
  );
  const [page, setPage] = useState(0);

  const nodes = data?.nodes ?? [];

  const sortedNodes = useMemo(() => {
    if (!sortColumn || !sortDirection) return nodes;
    return [...nodes].sort((a, b) =>
      compareNodes(a, b, sortColumn, sortDirection),
    );
  }, [nodes, sortColumn, sortDirection]);

  const totalNodes = sortedNodes.length;
  const paginatedNodes = sortedNodes.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  function handleSort(column: SortableColumn) {
    if (sortColumn === column) {
      // Cycle: desc -> asc -> clear
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortColumn("avgDuration"); // reset to default
      }
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setPage(0);
  }

  function getAriaSort(
    column: SortableColumn,
  ): "ascending" | "descending" | "none" {
    if (sortColumn !== column || !sortDirection) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  }

  return (
    <WidgetShell
      title={axelorBridge.translate("Duration by Node")}
      isLoading={isLoading}
      error={error ?? undefined}
      onRetry={() => void refetch()}
    >
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${sortColumn === col.key && sortDirection ? styles.thSorted : ""}`}
                  onClick={() => handleSort(col.key)}
                  aria-sort={getAriaSort(col.key)}
                >
                  {axelorBridge.translate(col.labelKey)}
                  {sortColumn === col.key && sortDirection && (
                    <SortIndicator direction={sortDirection} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedNodes.map((node) => (
              <tr
                key={node.activityId}
                className={`${styles.row} ${selectedAnalyticsNodeId === node.activityId ? styles.rowSelected : ""}`}
                onClick={() => selectAnalyticsNode(node.activityId)}
              >
                <td className={styles.tdName}>
                  {node.activityName ?? node.activityId}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.totalDuration)}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.workDuration)}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.idleDuration)}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.avgDuration)}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.minDuration)}
                </td>
                <td className={styles.tdNum}>
                  {formatDuration(node.maxDuration)}
                </td>
                <td className={styles.tdNum}>{formatDuration(node.p50)}</td>
                <td className={styles.tdNum}>{formatDuration(node.p95)}</td>
                <td className={styles.tdNum}>{formatDuration(node.p99)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalNodes > PAGE_SIZE && (
        <PaginationBar
          total={totalNodes}
          offset={page * PAGE_SIZE}
          limit={PAGE_SIZE}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </WidgetShell>
  );
}
