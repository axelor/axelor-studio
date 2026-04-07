import { useCallback, useEffect, useRef, useState } from "react";
import type { ResponsiveLayouts, LayoutItem } from "react-grid-layout";
import { ServiceInstance } from "@studio/shared/services/Service";

const COCKPIT_VIEW_NAME = "cockpit-dashboard";
const BREAKPOINT_ORDER = ["lg", "md", "sm", "xs"];

interface LayoutPersistenceResult {
  layouts: ResponsiveLayouts | null;
  saveLayouts: (layouts: ResponsiveLayouts) => void;
  isLoaded: boolean;
}

export function useLayoutPersistence(
  defaultLayouts: ResponsiveLayouts,
): LayoutPersistenceResult {
  const [layouts, setLayouts] = useState<ResponsiveLayouts | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load saved layout on mount
  useEffect(() => {
    loadSavedLayout()
      .then((saved) => {
        setLayouts(saved ?? defaultLayouts);
        setIsLoaded(true);
      })
      .catch(() => {
        setLayouts(defaultLayouts);
        setIsLoaded(true);
      });
  }, [defaultLayouts]);

  // Save layout on change (debounced via useRef -- NOT function property)
  const saveLayouts = useCallback((newLayouts: ResponsiveLayouts) => {
    setLayouts(newLayouts);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      persistLayout(newLayouts).catch(console.error);
    }, 1000);
  }, []);

  return { layouts, saveLayouts, isLoaded };
}

async function loadSavedLayout(): Promise<ResponsiveLayouts | null> {
  // Layout persistence disabled — ws/meta/view/custom is not available
  // for standalone HTML views (returns 404). Use default layouts only.
  // TODO: Re-enable when cockpit has a registered dashboard view in MetaView.
  return null;
}

async function persistLayout(_layouts: ResponsiveLayouts): Promise<void> {
  // Layout persistence disabled — see loadSavedLayout comment.
  // No-op to prevent 404 and "invalid view schema" errors.
}

function deserializeLayouts(items: Record<string, string>[]): ResponsiveLayouts {
  const result: ResponsiveLayouts = {};
  BREAKPOINT_ORDER.forEach((bp, bpIdx) => {
    result[bp] = items.map((item) => ({
      i: item.widgetName,
      x: parseInt(item.colOffset.split(",")[bpIdx] ?? "0"),
      y: parseInt(item.rowOffset.split(",")[bpIdx] ?? "0"),
      w: parseInt(item.colSpan.split(",")[bpIdx] ?? "6"),
      h: parseInt(item.rowSpan.split(",")[bpIdx] ?? "4"),
    }));
  });
  return result;
}
