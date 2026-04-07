/**
 * Right-side slide-in detail panel (D-38, D-39).
 *
 * Opens from the right edge with a 200ms translateX animation.
 * Shows KPI detail: name, current value (color-coded), target, sparkline placeholder.
 * Closes on X button, Escape key (via useSlideInPanel), or click outside.
 */

import { useRef, useEffect, useCallback } from "react";

import type { KpiValue } from "../../api/types";

import styles from "./SlideInPanel.module.css";

interface SlideInPanelProps {
  isOpen: boolean;
  onClose: () => void;
  kpiDetail: { kpi: KpiValue; processName: string } | null;
}

const statusColorMap: Record<KpiValue["status"], string> = {
  ok: "var(--bs-success, #198754)",
  warning: "var(--bs-warning, #ffc107)",
  critical: "var(--bs-danger, #dc3545)",
};

/**
 * Placeholder sparkline data for Phase 50.
 * Real trend API comes in Phase 52.
 */
function SparklinePlaceholder() {
  // Simple SVG line chart as sparkline placeholder
  const points = [20, 35, 25, 45, 30, 40];
  const width = 240;
  const height = 60;
  const stepX = width / (points.length - 1);

  const pathD = points
    .map((y, i) => {
      const x = i * stepX;
      const scaledY = height - (y / 50) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${scaledY}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={styles.sparkline}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--ck-accent, #3b82f6)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlideInPanel({ isOpen, onClose, kpiDetail }: SlideInPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside-to-close
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
    // Delay listener attachment to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.open : ""}`}
      role="dialog"
      aria-label="KPI Detail"
      aria-hidden={!isOpen}
    >
      <div className={styles.header}>
        <h3 className={styles.processName}>
          {kpiDetail?.processName ?? ""}
        </h3>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <line
              x1="3"
              y1="3"
              x2="13"
              y2="13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="13"
              y1="3"
              x2="3"
              y2="13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {kpiDetail && (
        <div className={styles.body}>
          <div className={styles.kpiName}>{kpiDetail.kpi.name}</div>
          <div
            className={styles.kpiValue}
            style={{ color: statusColorMap[kpiDetail.kpi.status] }}
          >
            {kpiDetail.kpi.displayValue}
          </div>
          {kpiDetail.kpi.target != null && (
            <div className={styles.kpiTarget}>
              Target: {kpiDetail.kpi.target}
            </div>
          )}
          <div className={styles.sparklineContainer}>
            <SparklinePlaceholder />
          </div>
        </div>
      )}
    </div>
  );
}
