/**
 * Process detail header with hero counters (UI-SPEC).
 *
 * Shows process name in Heading style + 3 hero counter numbers
 * for Running (green), Completed (neutral), and Failed (red).
 * Uses animated count-up pattern from KpiCounter.
 */

import { axelorBridge } from "@studio/shared/bridge";

import type { InstanceCountsResponse } from "../../api/types";
import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";

import styles from "./ProcessHeader.module.css";

interface ProcessHeaderProps {
  processName: string;
  counts: InstanceCountsResponse | undefined;
  isLoading: boolean;
}

interface HeroCounterProps {
  label: string;
  value: number;
  color?: string;
}

function HeroCounter({ label, value, color }: HeroCounterProps) {
  const animated = useAnimatedCounter(value);
  return (
    <div className={styles.hero}>
      <span className={styles.heroValue} style={color ? { color } : undefined}>
        {animated}
      </span>
      <span className={styles.heroLabel}>{label}</span>
    </div>
  );
}

function SkeletonCounter() {
  return (
    <div className={styles.hero}>
      <span className={`${styles.heroValue} ${styles.skeleton}`}>&nbsp;</span>
      <span className={`${styles.heroLabel} ${styles.skeleton}`}>&nbsp;</span>
    </div>
  );
}

export function ProcessHeader({
  processName,
  counts,
  isLoading,
}: ProcessHeaderProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.processName}>{processName}</h2>
      <div className={styles.counters}>
        {isLoading || !counts ? (
          <>
            <SkeletonCounter />
            <SkeletonCounter />
            <SkeletonCounter />
          </>
        ) : (
          <>
            <HeroCounter
              label={axelorBridge.translate("Running")}
              value={counts.running}
              color="var(--bs-success, #198754)"
            />
            <HeroCounter
              label={axelorBridge.translate("Completed")}
              value={counts.completed}
            />
            <HeroCounter
              label={axelorBridge.translate("Failed")}
              value={counts.failed}
              color="var(--bs-danger, #dc3545)"
            />
          </>
        )}
      </div>
    </div>
  );
}
