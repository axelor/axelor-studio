/**
 * Process search input with fuzzy filtering (D-10).
 *
 * Single search input with magnifying glass icon and clear button.
 * 40px height per UI-SPEC exception.
 */

import { useCallback } from "react";

import { axelorBridge } from "@studio/shared/bridge";

import styles from "./ProcessSearch.module.css";

interface ProcessSearchProps {
  value: string;
  onChange: (query: string) => void;
}

export function ProcessSearch({ value, onChange }: ProcessSearchProps) {
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.searchIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="7"
          cy="7"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="11.3"
          y1="11.3"
          x2="14.5"
          y2="14.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={axelorBridge.translate("Search processes...")}
        aria-label={axelorBridge.translate("Search processes")}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label={axelorBridge.translate("Clear search")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <line
              x1="3"
              y1="3"
              x2="11"
              y2="11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="11"
              y1="3"
              x2="3"
              y2="11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
