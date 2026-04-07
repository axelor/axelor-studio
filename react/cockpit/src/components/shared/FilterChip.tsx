/**
 * Removable filter chip pill (D-10, UI-SPEC).
 *
 * 28px-tall pill with close icon. Supports keyboard removal
 * via Enter or Backspace. Entry animation via CSS @keyframes.
 */

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./FilterChip.module.css";

interface FilterChipProps {
  label: string;
  type: "node" | "dateRange" | "status";
  onRemove: () => void;
}

export function FilterChip({ label, type, onRemove }: FilterChipProps) {
  return (
    <span
      className={`${styles.chip} ${type === "node" ? styles.chipNode : ""}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Backspace") onRemove();
      }}
    >
      <span className={styles.chipLabel}>{label}</span>
      <button
        type="button"
        className={styles.chipClose}
        onClick={onRemove}
        aria-label={`${axelorBridge.translate("Remove filter:")} ${label}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <line
            x1="3"
            y1="3"
            x2="9"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="9"
            y1="3"
            x2="3"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}
