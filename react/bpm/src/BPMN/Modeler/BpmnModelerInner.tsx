import React, { useEffect, useState, useRef, useMemo } from "react";
import { Resizable } from "re-resizable";
import { translate } from "@studio/shared/i18n";
import { SnackbarNotification } from "@studio/shared/components";
import { Box } from "@axelor/ui";

import "bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@bpmn-io/properties-panel/dist/assets/properties-panel.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";
import "../css/bpmn.css";
import "../css/colors.css";
import "../css/tokens.css";
import { useDialog } from "@studio/shared/hooks";
import { IconButton } from "generic-builder";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { useKeyPress } from "../../custom-hooks/useKeyPress";
import { useStore } from "../../store";

import DeployDialog from "./views/DeployDialog";
import IssuePanel from "./IssuePanel";
import styles from "./bpmn-modeler.module.css";
import { issuePanelStyle, DRAWER_WIDTH, TOOL_PANEL_MAX_HEIGHT } from "./utils/modeler-helpers";
import { useColorManagement } from "./hooks/useColorManagement";
import useModelerEvents from "./hooks/useModelerEvents";
import { useModeler } from "./hooks/useModeler";
import { useDeployProgress } from "./hooks/useDeployProgress";
import useWkfStore from "./stores/useWkfStore";
import useSelectionStore from "./stores/useSelectionStore";
import useSnackbarStore from "./stores/useSnackbarStore";
import { BpmnActionsContext } from "./context/BpmnActionsContext";
import { useBpmnDiagram } from "./hooks/useBpmnDiagram";

// UI zone components
import BpmnCanvas from "./components/BpmnCanvas";
import BpmnTopToolbar from "./components/BpmnTopToolbar";
import BpmnBottomToolbar from "./components/BpmnBottomToolbar";
import BpmnFooter from "./components/BpmnFooter";
import PropertiesDrawer from "./components/PropertiesDrawer";
import ProgressOverlay from "./components/ProgressOverlay";

const TimerEvents = React.lazy(() => import("./TimerEvent"));

function BpmnModelerInner() {
  const bpmnModeler = useModeler();

  // --- External dependencies for useBpmnDiagram ---
  const { update, state } = useStore();
  const { info } = state || {};
  const openDialog = useDialog();
  const deployProgress = useDeployProgress();
  const { progress, allowProgressBarDisplay } = deployProgress;

  // --- The big extraction: all business logic in one hook ---
  const diagram = useBpmnDiagram(bpmnModeler, { update, info, openDialog, deployProgress });

  // --- Zustand store selectors (reactive reads for rendering) ---
  const wkf = useWkfStore((s) => s.wkf);
  const setWkf = useWkfStore((s) => s.setWkf);
  const _id = useWkfStore((s) => s.id);
  const selectedElement = useSelectionStore((s) => s.selectedElement);
  // SnackbarNotification handles its own subscription via the store hook prop

  // --- Local UI state (stays in component) ---
  const [width, setWidth] = useState(DRAWER_WIDTH);
  const [height, setHeight] = useState<string | number>("100%");
  const [drawerOpen, setDrawerOpen] = useState(true);

  // --- Color management (depends on reactive selectedElement) ---
  const { changeColor } = useColorManagement({
    modeler: bpmnModeler,
    selectedElement,
  });

  // --- Resize logic ---
  const initialWidth = useRef(window.innerWidth);
  const availableWidth = useRef(window.innerWidth);

  useEffect(() => {
    if (!drawerOpen) return;

    const checkWindowSize = () => {
      const windowWidth = window.innerWidth;
      availableWidth.current = windowWidth;
      setWidth(() => {
        const w = Math.round((windowWidth * DRAWER_WIDTH) / initialWidth.current);
        const addOn = Math.round(Math.max(0, 1024 - windowWidth) / 5);
        return w + addOn;
      });
    };

    window.addEventListener("resize", checkWindowSize);

    return () => {
      window.removeEventListener("resize", checkWindowSize);
    };
  }, [drawerOpen]);

  // --- beforeunload ---
  useEffect(() => {
    window.top && window.top.addEventListener("beforeunload", diagram.alertUser);
    return () => {
      window.top && window.top.removeEventListener("beforeunload", diagram.alertUser);
    };
  });

  // --- Refs for event handlers that depend on frequently-changing state ---
  const initialStateRef = useRef(diagram.initialState);
  initialStateRef.current = diagram.initialState;

  const selectedElementRef = useRef(selectedElement);
  selectedElementRef.current = selectedElement;

  // --- Modeler events ---
  useModelerEvents({
    bpmnModeler,
    initialStateRef,
    checkIfUpdated: diagram.checkIfUpdated,
    update,
    selectedElementRef,
    updateTabs: diagram.updateTabs,
    addCallActivityExtensionElement: diagram.addCallActivityExtensionElement,
    handleSnackbarClick: diagram.handleSnackbarClick,
    setIssues: diagram.setIssues,
  });

  // --- Initialization: fetch diagram when modeler becomes available ---
  // Canvas and properties panel attachment is handled by callback refs
  // in BpmnCanvas and PropertiesDrawer components (deferred attach pattern).
  // React processes refs before effects, so attachTo() runs before initializeDiagram().
  useEffect(() => {
    if (!bpmnModeler) return;
    diagram.initializeDiagram();
  }, [bpmnModeler, diagram.initializeDiagram]);

  // --- Fetch studio app config ---
  useEffect(() => {
    async function fetchApp() {
      const { getApp, getAppStudioConfig } = await import("../../shared/services");
      const app = await getApp({
        data: {
          _domain: `self.code = 'studio'`,
        },
      });
      if (!app) return;
      const appConfig = await getAppStudioConfig(app.appStudio?.id ?? 0);
      useWkfStore.getState().setEnableStudioApp(!!appConfig?.enableStudioApp);
    }
    fetchApp();
  }, []);

  // --- Fetch BPM app config for progress bar display setting ---
  useEffect(() => {
    async function fetchBpmAppConfig() {
      try {
        const { getApp, getAppBPMConfig } = await import("../../shared/services");
        const app = await getApp({
          data: { _domain: `self.code = 'bpm'` },
        });
        if (!app) return;
        const appConfig = await getAppBPMConfig(app.appBpm?.id ?? 0);
        deployProgress.setAllowProgressBarDisplay(!!appConfig?.useProgressDeploymentBar);
      } catch (err) {
        console.error("[BpmnModeler] Failed to fetch app configuration:", err);
      }
    }
    fetchBpmAppConfig();
  }, []);

  // --- Keyboard shortcut ---
  useKeyPress(["s"], diagram.onSave);

  // --- Context pad mouse events ---
  useEffect(() => {
    if (!bpmnModeler || !selectedElement) return;
    const canvas = bpmnModeler.get("canvas");
    const container = (canvas as unknown as { getContainer(): HTMLElement }).getContainer(); // safety: bpmn-js canvas.getContainer() not in typed API
    const contextPad = bpmnModeler.get("contextPad") as { open(el: unknown): void; close(el: unknown): void };

    const handleMouseEnter = () => {
      // Guard: only open context pad if the element has graphics in the canvas
      // (root elements like Process/Collaboration don't have gfx)
      if (selectedElement?.id && canvas.getGraphics(selectedElement.id)) {
        contextPad.open(selectedElement);
      }
    };

    const handleMouseLeave = () => {
      contextPad.close(selectedElement);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [bpmnModeler, selectedElement]);

  // --- Drawer width helper ---
  const setCSSWidth = (w: string) => {
    setDrawerOpen(w === "0px" ? false : true);
  };

  // --- BpmnActions context value for DrawerContent zero-prop pattern ---
  const bpmnActions = useMemo<import("./context/BpmnActionsContext").BpmnActions>(
    () => ({
      handleAdd: diagram.handleAdd,
      reloadView: diagram.reloadView,
      onSave: diagram.onSave,
      handleMenuActionTab: diagram.handleMenuActionTab,
      updateCommentsCount: diagram.updateCommentsCount,
      handleSnackbarClick: diagram.handleSnackbarClick,
      addNewVersion: diagram.addNewVersion,
      changeColor,
      handleChange: diagram.handleChange,
    }),
    [
      diagram.handleAdd,
      diagram.reloadView,
      diagram.onSave,
      diagram.handleMenuActionTab,
      diagram.updateCommentsCount,
      diagram.handleSnackbarClick,
      diagram.addNewVersion,
      changeColor,
      diagram.handleChange,
    ],
  );

  return (
    <BpmnActionsContext.Provider value={bpmnActions}>
      <React.Fragment>
        <Box id="container">
          <React.Suspense fallback={<></>}>
            {!diagram.isTimerTask && <TimerEvents />}
          </React.Suspense>
          <Box id="bpmncontainer" pos="relative" color="body">
            <div id="propview"></div>
            <BpmnTopToolbar
              leftToolbar={diagram.leftToolbar}
              rightToolbar={diagram.rightToolbar}
              wkf={wkf}
              setWkf={setWkf}
              updateWkfModel={diagram.updateWkfModel}
              getModels={diagram.getModels}
              uploadFile={diagram.uploadFile}
            />
            <BpmnCanvas
              modeler={bpmnModeler}
              isXmlEditorOpen={diagram.isXmlEditorOpen}
              onCloseXmlEditor={() => diagram.setXmlEditorOpen(false)}
            />
            <BpmnBottomToolbar
              bottomToolbar={diagram.bottomToolbar}
              isXmlEditorOpen={diagram.isXmlEditorOpen}
            />
          </Box>
          <PropertiesDrawer
            modeler={bpmnModeler}
            width={width}
            height={height}
            setWidth={setWidth}
            setHeight={setHeight}
            setCSSWidth={setCSSWidth}
            drawerOpen={drawerOpen}
            isXmlEditorOpen={diagram.isXmlEditorOpen}
            availableWidth={availableWidth}
          />
          <SnackbarNotification
            store={useSnackbarStore}
            onClose={(...args: unknown[]) =>
              diagram.handleSnackbarClose(args[0], args[1] as string)
            }
          />

          {diagram.openDelopyDialog && (
            <DeployDialog
              open={diagram.openDelopyDialog}
              onClose={() => diagram.setDelopyDialog(false)}
              ids={diagram.ids}
              onOk={(wkfMigrationMap: unknown, isMigrateOld: boolean) =>
                diagram.handleOk(wkfMigrationMap, isMigrateOld)
              }
              element={selectedElement}
            />
          )}
        </Box>
        <ProgressOverlay progress={progress} allowProgressBarDisplay={allowProgressBarDisplay} />
        <Resizable
          size={{ width: "100%", height: diagram.issuePanelHeight }}
          maxHeight={TOOL_PANEL_MAX_HEIGHT}
          minHeight={0}
          enable={{
            top: true,
          }}
          style={issuePanelStyle}
          onResizeStop={(e, direction, ref, d) => {
            const h = diagram.issuePanelHeight + d.height;
            diagram.setIssuePanelHeight(h);
            diagram.updateElementpaletteHeight(h);
          }}
        >
          <IssuePanel issues={diagram.issues} bpmnModeler={bpmnModeler} t={translate} />
          <IconButton className={styles.closePanelBtn} onClick={diagram.handleToolPanelClose}>
            <MaterialIcon icon="close" fontSize={16} />
          </IconButton>
        </Resizable>
        <BpmnFooter
          issues={diagram.issues}
          onToggle={diagram.handleToolPanelToggle}
          translate={translate}
        />
      </React.Fragment>
    </BpmnActionsContext.Provider>
  );
}

export default BpmnModelerInner;
