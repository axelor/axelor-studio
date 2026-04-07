/**
 * Status filter pill row with counts (D-16, UI-SPEC).
 *
 * Renders horizontal row of pill buttons for filtering instances by status.
 * Active pill is accent-colored; inactive pills use secondary background.
 * Uses axelorBridge.translate() for i18n labels.
 */

import { axelorBridge } from "@studio/shared/bridge";

import type { InstanceCountsResponse, InstanceStatus } from "../../api/types";

import styles from "./StatusFilterPills.module.css";

interface StatusFilterPillsProps {
  counts: InstanceCountsResponse;
  activeFilter: InstanceStatus | null;
  onFilterChange: (status: InstanceStatus | null) => void;
}

interface PillConfig {
  status: InstanceStatus | null;
  label: string;
  countKey: keyof InstanceCountsResponse | null;
}

const pills: PillConfig[] = [
  { status: null, label: "All", countKey: null },
  { status: "ACTIVE", label: "Running", countKey: "running" },
  { status: "COMPLETED", label: "Completed", countKey: "completed" },
  { status: "INTERNALLY_TERMINATED", label: "Failed", countKey: "failed" },
  { status: "SUSPENDED", label: "Suspended", countKey: "suspended" },
];

export function StatusFilterPills({
  counts,
  activeFilter,
  onFilterChange,
}: StatusFilterPillsProps) {
  return (
    <div className={styles.container} role="group" aria-label="Filter by status">
      {pills.map(({ status, label, countKey }) => {
        const isActive = activeFilter === status;
        return (
          <button
            key={label}
            type="button"
            className={`${styles.pill} ${isActive ? styles.active : styles.inactive}`}
            aria-pressed={isActive}
            onClick={() => onFilterChange(status)}
          >
            <span>{axelorBridge.translate(label)}</span>
            {countKey != null && (
              <span className={styles.count}>{counts[countKey]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
