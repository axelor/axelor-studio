import React from "react";
import { Input } from "@axelor/ui";

import styles from "./code-editor.module.css";

export interface TextareaFallbackProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: number | string;
  loading?: boolean;
  className?: string;
}

/**
 * Graceful degradation fallback when Monaco fails to load.
 * Renders a styled textarea matching Monaco's dimensions using @axelor/ui Input.
 * Used as both the Suspense fallback (with loading=true) and
 * the ErrorBoundary fallback.
 */
export function TextareaFallback({
  value,
  onChange,
  readOnly = false,
  height = 120,
  loading = false,
  className,
}: TextareaFallbackProps) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${styles.fallbackContainer} ${className ?? ""}`}
      style={{ height: resolvedHeight }}
    >
      {loading && <div className={styles.loadingIndicator} />}
      <Input
        as="textarea"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        readOnly={readOnly}
        style={{
          width: "100%",
          height: "100%",
          fontFamily: "monospace",
          fontSize: "14px",
          resize: "none",
        }}
      />
    </div>
  );
}
