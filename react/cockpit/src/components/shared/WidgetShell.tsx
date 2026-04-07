import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorBanner } from "./ErrorBanner";
import styles from "./WidgetShell.module.css";
import classnames from "classnames";

// ---------------------------------------------------------------------------
// Context for child widgets to read container dimensions
// ---------------------------------------------------------------------------

export interface WidgetDimensions {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WidgetShellProps {
  title: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onCollapse?: () => void;
  onRemove?: () => void;
  children: ReactNode;
}

/**
 * Widget wrapper providing a consistent card shell with header (title, collapse,
 * remove), loading skeleton, error banner, and ResizeObserver-driven dimensions.
 */
export function WidgetShell({
  title,
  isLoading = false,
  error = null,
  onRetry,
  onCollapse,
  onRemove,
  children,
}: WidgetShellProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [dimensions, setDimensions] = useState<WidgetDimensions>({
    width: 0,
    height: 0,
  });

  // ResizeObserver on body to expose container dimensions
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
    onCollapse?.();
  }, [onCollapse]);

  // ---------------------------------------------------------------------------
  // Body content
  // ---------------------------------------------------------------------------

  let bodyContent: ReactNode;
  if (error) {
    bodyContent = <ErrorBanner message={error.message} onRetry={onRetry} />;
  } else if (isLoading) {
    bodyContent = <LoadingSkeleton />;
  } else {
    bodyContent = children;
  }

  return (
    <div className={styles.shell}>
      {/* Header */}
      <div className={`${styles.header} ck-drag-handle`}>
        <span className={classnames(styles.title, "ck-font-label")}>
          {title}
        </span>
        <div className={styles.actions}>
          {onCollapse && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleCollapse}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "+" : "\u2013"}
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={onRemove}
              aria-label="Remove"
            >
              \u00d7
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          ref={bodyRef}
          className={styles.body}
          data-width={dimensions.width}
          data-height={dimensions.height}
        >
          {bodyContent}
        </div>
      )}
    </div>
  );
}
