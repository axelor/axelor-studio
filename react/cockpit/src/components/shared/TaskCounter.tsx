import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";
import styles from "./TaskCounter.module.css";

interface TaskCounterProps {
  label: string;
  count: number;
  variant: "default" | "accent" | "danger";
}

const variantClass: Record<TaskCounterProps["variant"], string> = {
  default: styles.count,
  accent: styles.countAccent,
  danger: styles.countDanger,
};

/**
 * Single task count display (Today/Next/Late pattern).
 *
 * Uses useAnimatedCounter for count-up animation.
 * Variant controls color: default (text), accent (--ck-accent), danger (--bs-danger).
 */
export function TaskCounter({ label, count, variant }: TaskCounterProps) {
  const animatedCount = useAnimatedCounter(count);

  return (
    <div className={styles.counter}>
      <span className={variantClass[variant]}>{animatedCount}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
