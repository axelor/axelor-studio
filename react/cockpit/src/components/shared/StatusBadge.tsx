/**
 * Process status indicator badge.
 *
 * Maps statusSelect (1=Draft, 2=Active, 3=Terminated) to
 * a colored pill badge.
 */

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  statusSelect: number;
}

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "Draft", className: styles.draft },
  2: { label: "Active", className: styles.active },
  3: { label: "Terminated", className: styles.terminated },
};

export function StatusBadge({ statusSelect }: StatusBadgeProps) {
  const config = STATUS_MAP[statusSelect] ?? STATUS_MAP[1];
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {axelorBridge.translate(config.label)}
    </span>
  );
}
