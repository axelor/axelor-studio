/**
 * Slide-in panel state hook (D-38, D-39).
 *
 * Manages open/close state with KPI detail payload.
 * Handles Escape key binding for keyboard-driven close.
 */

import { useState, useCallback, useEffect } from "react";

import type { KpiValue } from "../api/types";

export interface SlideInPanelState {
  isOpen: boolean;
  kpiDetail: { kpi: KpiValue; processName: string } | null;
  open: (kpi: KpiValue, processName: string) => void;
  close: () => void;
}

export function useSlideInPanel(): SlideInPanelState {
  const [isOpen, setIsOpen] = useState(false);
  const [kpiDetail, setKpiDetail] = useState<{
    kpi: KpiValue;
    processName: string;
  } | null>(null);

  const open = useCallback((kpi: KpiValue, processName: string) => {
    setKpiDetail({ kpi, processName });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing content for close animation
    setTimeout(() => setKpiDetail(null), 200);
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  return { isOpen, kpiDetail, open, close };
}
