/**
 * Gradient legend bar for heatmap visualization (D-13).
 *
 * Horizontal gradient (28px total: 12px gradient + 16px label row)
 * with min/max value labels. Supports duration and frequency color scales.
 */

import styles from "./VisualMapLegend.module.css";

interface VisualMapLegendProps {
  minValue: number;
  maxValue: number;
  mode: "duration" | "frequency";
  formatValue: (v: number) => string;
}

export function VisualMapLegend({
  minValue,
  maxValue,
  mode,
  formatValue,
}: VisualMapLegendProps) {
  return (
    <div
      className={styles.legend}
      aria-label={`Heatmap color scale: ${formatValue(minValue)} to ${formatValue(maxValue)}`}
    >
      <div
        className={`${styles.gradient} ${mode === "frequency" ? styles.gradientFreq : styles.gradientDur}`}
      />
      <div className={styles.labels}>
        <span className={styles.labelMin}>{formatValue(minValue)}</span>
        <span className={styles.labelMax}>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
}
