/**
 * KPI indicator badge (D-08).
 *
 * Renders green/red/yellow compact badges with icon + displayValue.
 * Clickable: fires onClick with the specific KpiValue to open detail panel.
 */

import type { JSX } from "react";
import type { KpiValue } from "../../api/types";

import styles from "./KpiBadge.module.css";

interface KpiBadgeProps {
  kpis: KpiValue[];
  onClick: (kpi: KpiValue) => void;
}

const statusClasses: Record<KpiValue["status"], string> = {
  ok: styles.ok,
  warning: styles.warning,
  critical: styles.critical,
};

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polyline
        points="2,5 4.5,7.5 8,2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <line
        x1="2.5"
        y1="2.5"
        x2="7.5"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="7.5"
        y1="2.5"
        x2="2.5"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <line
        x1="5"
        y1="2"
        x2="5"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="5" cy="8" r="0.75" fill="currentColor" />
    </svg>
  );
}

const iconMap: Record<KpiValue["status"], () => JSX.Element> = {
  ok: CheckIcon,
  warning: WarningIcon,
  critical: XIcon,
};

export function KpiBadge({ kpis, onClick }: KpiBadgeProps) {
  return (
    <span className={styles.container}>
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.status];
        return (
          <button
            key={kpi.name}
            type="button"
            className={`${styles.badge} ${statusClasses[kpi.status]}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick(kpi);
            }}
            title={kpi.name}
          >
            <Icon />
            <span>{kpi.displayValue}</span>
          </button>
        );
      })}
    </span>
  );
}
