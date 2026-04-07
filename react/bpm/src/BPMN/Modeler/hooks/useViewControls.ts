import React, { useCallback, useState } from "react";
import type { TypedBpmnModeler } from "@studio/shared/types";

import { PALETTE_WIDTHS } from "../constants";
import { TOOL_PANEL_MAX_HEIGHT } from "../utils/modeler-helpers";
import useSelectionStore from "../stores/useSelectionStore";
import useSnackbarStore from "../stores/useSnackbarStore";
import useTabStore from "../stores/useTabStore";

// --- Types ---

interface UseViewControlsDeps {
  bpmnModelerRef: React.MutableRefObject<TypedBpmnModeler | null>;
}

interface ViewControlsReturn {
  // UI state
  isXmlEditorOpen: boolean;
  setXmlEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issuePanelHeight: number;
  setIssuePanelHeight: React.Dispatch<React.SetStateAction<number>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issues: { errors: unknown[]; warnings: unknown[] };
  setIssues: React.Dispatch<
    React.SetStateAction<{ errors: unknown[]; warnings: unknown[] }>
  >;
  // Functions
  toggleXmlEditor: () => void;
  toggleMinimap: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  enterFullscreen: () => void;
  handleToolPanelToggle: (e: React.MouseEvent) => void;
  handleToolPanelClose: () => void;
  updateElementpaletteHeight: (height: number) => void;
  handleMenuActionTab: (val: boolean) => void;
  handleChange: (newValue: { id: string } | null) => void;
  updateCommentsCount: (isIncrement?: boolean) => void;
  alertUser: (event: BeforeUnloadEvent) => void;
  handleSnackbarClick: (messageType: string, message: string) => void;
  handleSnackbarClose: (event: unknown, reason: string) => void;
}

// --- Hook ---

export function useViewControls({
  bpmnModelerRef,
}: UseViewControlsDeps): ViewControlsReturn {
  // --- Local state ---
  const [isXmlEditorOpen, setXmlEditorOpen] = useState(false);
  const [issuePanelHeight, setIssuePanelHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<{ errors: unknown[]; warnings: unknown[] }>({
    errors: [],
    warnings: [],
  });

  // --- Snackbar helpers ---
  const handleSnackbarClick = useCallback(
    (messageType: string, message: string) => {
      useSnackbarStore.getState().show(messageType, message);
    },
    [],
  );

  const handleSnackbarClose = useCallback(
    (event: unknown, reason: string) => {
      if (reason === "clickaway") return;
      useSnackbarStore.getState().close();
    },
    [],
  );

  // --- XML editor ---
  const toggleXmlEditor = useCallback(() => {
    setXmlEditorOpen((prev) => !prev);
  }, []);

  // --- Tab / selection helpers ---
  const handleMenuActionTab = useCallback((val: boolean) => {
    useSelectionStore.getState().setMenuActionDisable(val);
  }, []);

  const handleChange = useCallback((newValue: { id: string } | null) => {
    const currentTabs = useTabStore.getState().tabs;
    const val = currentTabs.findIndex(
      (tab: { id: string }) => tab.id === newValue?.id,
    );
    const tabValue = val > -1 ? val : 0;
    useTabStore.getState().setTabValue(tabValue);
  }, []);

  const updateCommentsCount = useCallback(
    (isIncrement: boolean = false) => {
      if (isIncrement) {
        useSelectionStore
          .getState()
          .setComments((comments: number) => comments + 1);
      } else {
        useSelectionStore
          .getState()
          .setComments((comments: number) => comments - 1);
      }
    },
    [],
  );

  // --- Zoom / minimap / fullscreen ---
  const toggleMinimap = () => {
    (bpmnModelerRef.current?.get("minimap") as { toggle(): void } | undefined)?.toggle();
  };

  const zoomIn = () => {
    (bpmnModelerRef.current?.get("zoomScroll") as { stepZoom(delta: number): void } | undefined)?.stepZoom(1);
  };

  const zoomOut = () => {
    (bpmnModelerRef.current?.get("zoomScroll") as { stepZoom(delta: number): void } | undefined)?.stepZoom(-1);
  };

  const resetViewport = () => {
    bpmnModelerRef.current?.get("canvas").zoom("fit-viewport");
  };

  const enterFullscreen = () => {
    const elem = document.documentElement as HTMLElement & {
      mozRequestFullScreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  // --- Element palette height ---
  const updateElementpaletteHeight = (height: number) => {
    const palette = document.querySelector(
      "#bpmnview > .bjs-container > .djs-container > .djs-palette",
    );
    if (!palette) return;
    const width =
      height > PALETTE_WIDTHS.THRESHOLD
        ? PALETTE_WIDTHS.EXPANDED
        : PALETTE_WIDTHS.COLLAPSED;
    (palette as HTMLElement).style.width = `${width}px`;
  };

  // --- Issue / tool panel ---
  const handleToolPanelToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const linting = modeler.get("linting");
    if (isOpen && issuePanelHeight >= 50) {
      linting.toggle(false); // D-03: respect user's manual toggle off
      setIssuePanelHeight(0);
      updateElementpaletteHeight(0);
    } else {
      linting.toggle(true); // D-02: panel open activates linting (post-load, safe per D-04)
      setIssuePanelHeight(TOOL_PANEL_MAX_HEIGHT);
      updateElementpaletteHeight(TOOL_PANEL_MAX_HEIGHT);
    }
    setIsOpen((prev) => !prev);
  };

  const handleToolPanelClose = () => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const linting = modeler.get("linting");
    linting.toggle(false); // D-03: explicit panel close deactivates linting
    setIssuePanelHeight(0);
    setIsOpen(false);
    updateElementpaletteHeight(0);
  };

  // --- Unload guard ---
  const alertUser = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "Are you sure you want to close the tab?";
  };

  return {
    // UI state
    isXmlEditorOpen,
    setXmlEditorOpen,
    issuePanelHeight,
    setIssuePanelHeight,
    isOpen,
    setIsOpen,
    issues,
    setIssues,
    // Functions
    toggleXmlEditor,
    toggleMinimap,
    zoomIn,
    zoomOut,
    resetViewport,
    enterFullscreen,
    handleToolPanelToggle,
    handleToolPanelClose,
    updateElementpaletteHeight,
    handleMenuActionTab,
    handleChange,
    updateCommentsCount,
    alertUser,
    handleSnackbarClick,
    handleSnackbarClose,
  };
}
