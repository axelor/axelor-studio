/**
 * Paginated instance list table (D-14, D-16, D-17, D-18, UI-SPEC).
 *
 * Renders instance rows with status badge, progress bar, linked objects,
 * duration, and start time. Supports server-side filtering via status pills
 * and search input. Failed/stuck instances sort to top (server-side).
 */

import { useState, useCallback, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { axelorBridge } from "@studio/shared/bridge";

import type { InstanceSummary, InstanceStatus } from "../../api/types";
import { useInstances } from "../../hooks/useInstances";
import { useCockpitStore } from "../../stores/useCockpitStore";
import { formatDuration, formatRelativeTime } from "../../utils/format";
import { InstanceProgressBar } from "../shared/InstanceProgressBar";
import { LinkedObjectList } from "../shared/LinkedObjectBadge";
import { LoadingSkeleton } from "../shared/LoadingSkeleton";
import { ErrorBanner } from "../shared/ErrorBanner";
import { PaginationBar } from "../shared/PaginationBar";

import styles from "./InstanceList.module.css";

// ---------------------------------------------------------------------------
// Status display mapping
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<InstanceStatus, string> = {
  ACTIVE: "Running",
  COMPLETED: "Completed",
  INTERNALLY_TERMINATED: "Failed",
  SUSPENDED: "Suspended",
};

const STATUS_CLASSES: Record<InstanceStatus, string> = {
  ACTIVE: styles.statusActive,
  COMPLETED: styles.statusCompleted,
  INTERNALLY_TERMINATED: styles.statusFailed,
  SUSPENDED: styles.statusSuspended,
};

function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  return (
    <span className={`${styles.statusBadge} ${STATUS_CLASSES[status]}`}>
      {axelorBridge.translate(STATUS_LABELS[status])}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className={styles.emptyState}>
      <svg
        className={styles.emptySvg}
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="16" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <circle cx="48" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <line x1="24" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <line x1="40" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <circle cx="48" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" fill="none" />
        <line x1="55" y1="23" x2="60" y2="28" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      </svg>
      <p className={styles.emptyText}>
        {hasFilters
          ? axelorBridge.translate("No instances match the current filters")
          : axelorBridge.translate("No instances found")}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InstanceList Props
// ---------------------------------------------------------------------------

interface InstanceListProps {
  processId: number;
  onSelectInstance: (instanceId: string) => void;
  selectedInstanceId: string | null;
}

// ---------------------------------------------------------------------------
// InstanceList Component
// ---------------------------------------------------------------------------

export function InstanceList({
  processId,
  onSelectInstance,
  selectedInstanceId,
}: InstanceListProps) {
  const navigate = useNavigate();

  const statusFilter = useCockpitStore((s) => s.instanceStatusFilter);
  const searchQuery = useCockpitStore((s) => s.instanceSearchQuery);
  const setSearchQuery = useCockpitStore((s) => s.setInstanceSearchQuery);

  const [page, setPage] = useState(0);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search: update store after 200ms idle
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Use setTimeout for debounce
      const timer = setTimeout(() => {
        setSearchQuery(value);
        setPage(0);
      }, 200);
      return () => clearTimeout(timer);
    },
    [setSearchQuery],
  );

  const { data, isLoading, error, refetch } = useInstances(
    processId,
    statusFilter,
    page,
    searchQuery,
  );

  const instances = data?.instances ?? [];
  const total = data?.total ?? 0;
  const offset = data?.offset ?? 0;
  const limit = data?.limit ?? 20;

  const hasFilters = statusFilter !== null || searchQuery.length > 0;

  const handleRowClick = (instance: InstanceSummary) => {
    onSelectInstance(instance.instanceId);
  };

  const handleRowDoubleClick = (instance: InstanceSummary) => {
    navigate(`/process/${processId}/instance/${instance.instanceId}`);
  };

  const handleRowKeyDown = (e: KeyboardEvent, instance: InstanceSummary) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigate(`/process/${processId}/instance/${instance.instanceId}`);
    } else if (e.key === " ") {
      e.preventDefault();
      onSelectInstance(instance.instanceId);
    }
  };

  if (isLoading) return <LoadingSkeleton height={300} />;
  if (error) {
    return (
      <ErrorBanner
        message={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Search input */}
      <div className={styles.searchWrapper}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={axelorBridge.translate("Search instances...")}
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label={axelorBridge.translate("Search instances")}
        />
      </div>

      {/* Table */}
      {instances.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.headerCell} style={{ width: 80 }}>
                  {axelorBridge.translate("Status")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("Instance ID")}
                </th>
                <th className={styles.headerCell} style={{ width: 100 }}>
                  {axelorBridge.translate("Progress")}
                </th>
                <th className={styles.headerCell}>
                  {axelorBridge.translate("Linked Object")}
                </th>
                <th className={styles.headerCell} style={{ width: 100 }}>
                  {axelorBridge.translate("Duration")}
                </th>
                <th className={styles.headerCell} style={{ width: 100 }}>
                  {axelorBridge.translate("Started")}
                </th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance, index) => (
                <tr
                  key={instance.instanceId}
                  className={`${styles.row} ${
                    selectedInstanceId === instance.instanceId
                      ? styles.rowSelected
                      : ""
                  }`}
                  onClick={() => handleRowClick(instance)}
                  onDoubleClick={() => handleRowDoubleClick(instance)}
                  onKeyDown={(e) => handleRowKeyDown(e, instance)}
                  role="button"
                  tabIndex={0}
                  aria-selected={selectedInstanceId === instance.instanceId}
                >
                  <td>
                    <InstanceStatusBadge status={instance.status} />
                  </td>
                  <td className={styles.instanceIdCell} title={instance.instanceId}>
                    {instance.instanceId}
                  </td>
                  <td>
                    <InstanceProgressBar
                      progress={instance.progress}
                      rowIndex={index}
                    />
                  </td>
                  <td>
                    <LinkedObjectList linkedObjects={instance.linkedObjects} />
                  </td>
                  <td className={styles.durationCell}>
                    {formatDuration(instance.durationMs)}
                  </td>
                  <td
                    className={styles.timeCell}
                    title={instance.startTime}
                  >
                    {formatRelativeTime(instance.startTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <PaginationBar
        total={total}
        offset={offset}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
}
