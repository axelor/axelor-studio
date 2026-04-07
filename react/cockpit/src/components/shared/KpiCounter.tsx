import { useEffect, useState } from "react";
import classnames from "classnames";
import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";
import { SparklineChart } from "./SparklineChart";
import styles from "./KpiCounter.module.css";

interface KpiCounterProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  staggerDelay?: number;
  sparklineData?: number[];
}

/**
 * Animated KPI counter with display font and count-up (D-16, UI-SPEC).
 *
 * Uses useAnimatedCounter for smooth count-up animation.
 * Supports staggered fade-in via ck-fade-in + is-visible with configurable delay.
 */
export function KpiCounter({
  label,
  value,
  suffix,
  color,
  staggerDelay = 0,
  sparklineData,
}: KpiCounterProps) {
  const animatedValue = useAnimatedCounter(value);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), staggerDelay);
    return () => clearTimeout(timer);
  }, [staggerDelay]);

  return (
    <div
      className={classnames(styles.counter, "ck-fade-in", {
        "is-visible": visible,
      })}
    >
      <span className={styles.value} style={color ? { color } : undefined}>
        {animatedValue}
        {suffix}
      </span>
      {sparklineData && sparklineData.length > 0 && (
        <SparklineChart data={sparklineData} />
      )}
      <span className={styles.label}>{label}</span>
    </div>
  );
}
