/**
 * 3-option segmented control for heatmap display mode (D-12).
 *
 * ARIA: role="radiogroup" with keyboard arrow navigation.
 * Modes: Active Tokens | Duration | Frequency.
 */

import { axelorBridge } from "@studio/shared/bridge";

import type { AnalyticsMode } from "../../api/types";
import { useCockpitStore } from "../../stores/useCockpitStore";

import styles from "./HeatmapToggle.module.css";

const MODES: Array<{ value: AnalyticsMode; labelKey: string }> = [
  { value: "tokens", labelKey: "Active Tokens" },
  { value: "duration", labelKey: "Duration" },
  { value: "frequency", labelKey: "Frequency" },
];

export function HeatmapToggle() {
  const mode = useCockpitStore((s) => s.analyticsMode);
  const setMode = useCockpitStore((s) => s.setAnalyticsMode);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = MODES.findIndex((m) => m.value === mode);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setMode(MODES[(idx + 1) % MODES.length].value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setMode(MODES[(idx - 1 + MODES.length) % MODES.length].value);
    }
  };

  return (
    <div
      className={styles.toggle}
      role="radiogroup"
      aria-label={axelorBridge.translate("Heatmap display mode")}
      onKeyDown={handleKeyDown}
    >
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={mode === m.value}
          className={`${styles.option} ${mode === m.value ? styles.active : ""}`}
          onClick={() => setMode(m.value)}
          tabIndex={mode === m.value ? 0 : -1}
        >
          {axelorBridge.translate(m.labelKey)}
        </button>
      ))}
    </div>
  );
}
