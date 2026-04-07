/**
 * Instance progress bar with staggered animation (D-15, UI-SPEC).
 *
 * Renders a 4px height bar showing instance completion percentage.
 * Supports staggered transition-delay based on row index for list animations.
 */

import styles from "./InstanceProgressBar.module.css";

interface InstanceProgressBarProps {
  progress: number; // 0-1
  rowIndex?: number;
}

export function InstanceProgressBar({
  progress,
  rowIndex = 0,
}: InstanceProgressBarProps) {
  const percent = Math.round(progress * 100);
  const delay = Math.min(rowIndex * 30, 300);

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{
            width: `${percent}%`,
            transitionDelay: `${delay}ms`,
          }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={styles.label}>{percent}%</span>
    </div>
  );
}
