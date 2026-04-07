/**
 * Right-side slide-in panel for node analytics (D-07, D-08).
 *
 * 320px panel sliding from right with:
 * - Duration table (NodeDurationTable)
 * - Assignee section (for userTask nodes)
 * - Passage history (PassageHistory)
 * - Branch distribution (BranchDistribution, for gateway nodes)
 *
 * Closes on X button, Escape key, or click outside.
 * Content crossfades 150ms when activityId changes.
 */

import { useRef, useEffect, useCallback } from "react";

import { axelorBridge } from "@studio/shared/bridge";

import { useNodeDetail } from "../../hooks/useNodeDetail";
import { useBranchDistribution } from "../../hooks/useBranchDistribution";
import { formatDuration } from "../../utils/format";
import { LoadingSkeleton } from "../shared/LoadingSkeleton";
import { ErrorBanner } from "../shared/ErrorBanner";
import { NodeDurationTable } from "./NodeDurationTable";
import { PassageHistory } from "./PassageHistory";
import { BranchDistribution } from "./BranchDistribution";

import type { AnalyticsNodeDuration } from "../../api/types";

import styles from "./NodeDetailPanel.module.css";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NodeDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  processInstanceId: string;
  activityId: string | null;
  processDefinitionKey: string;
  aggregateStats?: AnalyticsNodeDuration | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isGatewayType(activityType: string): boolean {
  return activityType.toLowerCase().includes("gateway");
}

function isUserTaskType(activityType: string): boolean {
  return activityType.toLowerCase().includes("usertask");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NodeDetailPanel({
  isOpen,
  onClose,
  processInstanceId,
  activityId,
  processDefinitionKey,
  aggregateStats,
}: NodeDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    data: nodeDetailData,
    isLoading,
    error,
    refetch,
  } = useNodeDetail(processInstanceId, activityId, processDefinitionKey);

  const nodeDetail = nodeDetailData?.nodeDetail ?? null;

  // Conditionally fetch branch distribution for gateway nodes
  const isGateway = nodeDetail ? isGatewayType(nodeDetail.activityType) : false;
  const { data: branchData } = useBranchDistribution(
    isGateway ? processDefinitionKey : null,
    isGateway ? activityId : null,
  );

  // -----------------------------------------------------------------------
  // Close on Escape
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // -----------------------------------------------------------------------
  // Close on click outside
  // -----------------------------------------------------------------------

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.open : ""}`}
      role="dialog"
      aria-label="Node detail"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {nodeDetail && (
            <>
              <h3 className={styles.title}>
                {nodeDetail.activityName ?? nodeDetail.activityId}
              </h3>
              <span className={styles.typeBadge}>
                {nodeDetail.activityType}
              </span>
              <code className={styles.technicalId}>
                {nodeDetail.activityId}
              </code>
            </>
          )}
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={axelorBridge.translate("Close panel")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {isLoading && <LoadingSkeleton height={200} />}

        {error && (
          <ErrorBanner
            message={
              error instanceof Error
                ? error.message
                : "Failed to load node detail"
            }
            onRetry={() => void refetch()}
          />
        )}

        {nodeDetail && !isLoading && (
          <div className={styles.content}>
            {/* Aggregate percentile stats (D-17) */}
            {aggregateStats && (
              <div className={styles.percentileSection}>
                <h4 className={styles.percentileHeading}>
                  {axelorBridge.translate("Duration Percentiles")}
                </h4>
                <div className={styles.percentileGrid}>
                  <div className={styles.percentileStat}>
                    <span className={styles.percentileValue}>
                      {formatDuration(aggregateStats.p50)}
                    </span>
                    <span className={styles.percentileLabel}>
                      {axelorBridge.translate("Median (P50)")}
                    </span>
                  </div>
                  <div className={styles.percentileStat}>
                    <span className={styles.percentileValue}>
                      {formatDuration(aggregateStats.p95)}
                    </span>
                    <span className={styles.percentileLabel}>
                      {axelorBridge.translate("P95")}
                    </span>
                  </div>
                  <div className={styles.percentileStat}>
                    <span className={styles.percentileValue}>
                      {formatDuration(aggregateStats.p99)}
                    </span>
                    <span className={styles.percentileLabel}>
                      {axelorBridge.translate("P99")}
                    </span>
                  </div>
                </div>
                <div className={styles.passCount}>
                  {aggregateStats.passCount}{" "}
                  {axelorBridge.translate("executions")}
                </div>
              </div>
            )}

            {/* Duration section */}
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                {axelorBridge.translate("Duration")}
              </h4>
              <NodeDurationTable
                duration={nodeDetail.duration}
                durationStats={nodeDetail.durationStats}
              />
            </section>

            {/* Assignee section (only for userTask) */}
            {isUserTaskType(nodeDetail.activityType) && (
              <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                  {axelorBridge.translate("Assignment")}
                </h4>
                <div className={styles.assigneeInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>
                      {axelorBridge.translate("Assignee")}
                    </span>
                    <span className={styles.infoValue}>
                      {nodeDetail.assignee ??
                        axelorBridge.translate("Unassigned")}
                    </span>
                  </div>
                  {nodeDetail.candidateGroups.length > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        {axelorBridge.translate("Candidate groups")}
                      </span>
                      <span className={styles.infoValue}>
                        {nodeDetail.candidateGroups.join(", ")}
                      </span>
                    </div>
                  )}
                  {nodeDetail.assignmentDate && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        {axelorBridge.translate("Assignment date")}
                      </span>
                      <span className={styles.infoValue}>
                        {new Date(
                          nodeDetail.assignmentDate,
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Passage History */}
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>
                {axelorBridge.translate("Passage history")}
              </h4>
              <PassageHistory passages={nodeDetail.passages} />
            </section>

            {/* Branch Distribution (gateway only) */}
            {isGateway && (
              <section className={styles.section}>
                <h4 className={styles.sectionTitle}>
                  {axelorBridge.translate("Branch distribution")}
                </h4>
                <BranchDistribution
                  branches={
                    branchData?.distributions ?? nodeDetail.branches
                  }
                />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
