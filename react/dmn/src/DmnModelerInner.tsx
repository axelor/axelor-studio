import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Box } from "@axelor/ui";
import { AlertDialog, SnackbarNotification , Logo  } from "@studio/shared/components";
import { filesToItems } from "@studio/shared/utils";
import { useDialog } from "@studio/shared/hooks";

import { useDmnModeler } from "./context/DmnModelerContext";
import { DmnActionsContext } from "./context/DmnActionsContext";
import useDmnSnackbarStore from "./stores/useDmnSnackbarStore";
import { useDmnDiagram } from "./hooks/useDmnDiagram";

// UI zone components
import DmnCanvas from "./components/DmnCanvas";
import DmnTopToolbar from "./components/DmnTopToolbar";
import DmnPropertiesDrawer from "./components/DmnPropertiesDrawer";
import DmnUploadDialog from "./components/DmnUploadDialog";

interface UploadedFile {
  id: number;
  fileName: string;
  [key: string]: unknown;
}

const DRAWER_WIDTH = 380;

function DmnModelerInner() {
  const dmnModeler = useDmnModeler();
  const openDialog = useDialog();

  // --- The big extraction: all business logic in one hook ---
  const diagram = useDmnDiagram(dmnModeler, { openDialog });

  // SnackbarNotification handles its own subscription via the store hook prop

  // --- Local UI state ---
  const [width, setWidth] = useState(DRAWER_WIDTH);
  const [height, setHeight] = useState<string | number>("100%");
  const [openUploadDialog, setUploadDialog] = useState(false);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [openAlert, setAlert] = useState(false);
  const [nameCol, setNameCol] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // --- Wire openPropertyPanelRef so useDmnDiagram can open/close drawer ---
  const openPropertyPanel = useCallback(() => {
    setWidth(DRAWER_WIDTH);
    setCSSWidth(`${width === 0 ? DRAWER_WIDTH : 0}px`);
  }, [width]);

  useEffect(() => {
    diagram.openPropertyPanelRef.current = openPropertyPanel;
  }, [openPropertyPanel, diagram.openPropertyPanelRef]);

  // --- drillDown handler sets width to 0 ---
  useEffect(() => {
    if (!dmnModeler) return;
    dmnModeler.on("views.changed", (event: { activeView?: { type: string } }) => {
      const { activeView } = event;
      if (activeView?.type === "decisionTable") {
        setWidth(0);
      }
    });
  }, [dmnModeler]);

  const setCSSWidth = (w: string) => {
    setDrawerOpen(w !== "0px");
  };

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

  // --- Initialize diagram on mount ---
  useEffect(() => {
    if (!dmnModeler) return;
    diagram.initializeDiagram();
  }, [dmnModeler, diagram.initializeDiagram]);

  // --- Wire views.changed event for decision table sheet ---
  useEffect(() => {
    if (!dmnModeler) return;
    diagram.wireViewsChanged();
  }, [dmnModeler, diagram.wireViewsChanged]);

  // --- Upload dialog handlers ---
  const handleUploadExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const fileItems = filesToItems(files, files.length);
      if (!fileItems.length) return;
      const result = await diagram.uploadChunk(fileItems[0] as unknown as Record<string, unknown>); // safety: Axelor file upload API returns dynamic Record
      if (result?.id) {
        setFile(result as UploadedFile);
      }
    },
    [diagram.uploadChunk],
  );

  const handleImportExcel = useCallback(async () => {
    if (!file) return;
    const success = await diagram.importExcel(file);
    if (success) {
      setUploadDialog(false);
      setFile(null);
    }
  }, [file, diagram.importExcel]);

  // --- Right toolbar with import button wired to local dialog state ---
  const rightToolbar = useMemo(() => {
    const items = [...diagram.rightToolbar];
    const importIdx = items.findIndex((i) => i._isImportButton);
    if (importIdx >= 0) {
      items[importIdx] = {
        ...items[importIdx],
        onClick: () => setUploadDialog(true),
      };
    }
    return items;
  }, [diagram.rightToolbar]);

  const handleDRDClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      diagram.handleViewDRD();
    },
    [diagram.handleViewDRD],
  );

  const alertClose = () => {
    setAlert(false);
  };

  const getNameCol = (nc: string) => {
    nc && setNameCol(nc);
  };

  const handleSnackbarClose = useCallback((...args: unknown[]) => {
    const reason = args[1] as string | undefined;
    if (reason === "clickaway") {
      return;
    }
    useDmnSnackbarStore.getState().close();
  }, []);

  // --- Actions provided to children via DmnActionsContext ---
  const actions = useMemo(
    () => ({
      onSave: diagram.onSave,
      deployDiagram: diagram.deployDiagram,
      onRefresh: diagram.onRefresh,
      reloadView: diagram.reloadView,
    }),
    [diagram.onSave, diagram.deployDiagram, diagram.onRefresh, diagram.reloadView],
  );

  // Guard: wait for modeler to be created
  if (!dmnModeler) return null;

  return (
    <DmnActionsContext.Provider value={actions}>
      <Box className="App" d="flex" flexDirection="column" color="body">
        <Box flex={1} d="flex" justifyContent="space-between" className="modeler">
          <Box w={100} h={100}>
            <DmnTopToolbar
              leftToolbar={diagram.leftToolbar}
              rightToolbar={rightToolbar}
              wkfModel={diagram.wkfModel}
              setWkfModel={diagram.setWkfModel}
              setId={diagram.setId}
              openDiagram={diagram.openDiagram}
              handleViewDRD={diagram.handleViewDRD}
              selectedElement={diagram.selectedElement}
              uploadFile={diagram.uploadFile}
              handleDRDClick={handleDRDClick}
            />
            <DmnCanvas />
          </Box>
          <DmnPropertiesDrawer
            dmnModeler={dmnModeler}
            width={width}
            height={height}
            setWidth={setWidth}
            setHeight={setHeight}
            setCSSWidth={setCSSWidth}
            drawerOpen={drawerOpen}
            availableWidth={availableWidth}
            getData={diagram.getData}
            getReadOnly={diagram.getReadOnly}
            onSave={diagram.onSave}
            nameCol={nameCol}
            getNameCol={getNameCol}
          />
        </Box>
        <AlertDialog
          openAlert={openAlert}
          alertClose={alertClose}
          handleAlertOk={diagram.reloadView}
          message="Current changes will be lost. Do you really want to proceed?"
          title="Refresh"
        />
        <SnackbarNotification store={useDmnSnackbarStore} onClose={handleSnackbarClose} />

        <DmnUploadDialog
          open={openUploadDialog}
          onClose={() => {
            setUploadDialog(false);
          }}
          file={file}
          onUploadExcel={handleUploadExcel}
          onImportExcel={handleImportExcel}
        />
        <Logo />
      </Box>
    </DmnActionsContext.Provider>
  );
}

export default DmnModelerInner;
