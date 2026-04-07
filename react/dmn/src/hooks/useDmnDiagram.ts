import { useCallback, useRef, useMemo } from "react";
import type { WkfDmnModel } from "@studio/shared/types";
import { translate } from "@studio/shared/i18n";
import type { DmnModeler } from "dmn-js/lib/Modeler";
import useDmnWkfStore from "../stores/useDmnWkfStore";
import useDmnSnackbarStore from "../stores/useDmnSnackbarStore";
import useDmnSelectionStore from "../stores/useDmnSelectionStore";
import { useDmnSheet } from "./useDmnSheet";
import { useDmnLifecycle } from "./useDmnLifecycle";
import { useDmnPersistence } from "./useDmnPersistence";
import { useDmnIO } from "./useDmnIO";
import { useDmnNavigation } from "./useDmnNavigation";

interface UseDmnDiagramOptions {
  openDialog: (opts: { title: string; message: string; onSave: () => void }) => void;
}

/**
 * Facade hook composing domain hooks for DmnModelerInner.
 * Delegates lifecycle, persistence, IO, and navigation to dedicated hooks.
 */
export function useDmnDiagram(dmnModeler: DmnModeler | null, { openDialog }: UseDmnDiagramOptions) {
  const dmnModelerRef = useRef<DmnModeler | null>(null);
  dmnModelerRef.current = dmnModeler;
  const diagramXmlRef = useRef<string | null>(null);
  const wkfModel = useDmnWkfStore((s) => s.wkfModel) as WkfDmnModel | null;
  const setWkfModel = useDmnWkfStore((s) => s.setWkfModel);
  const id = useDmnWkfStore((s) => s.id);
  const setId = useDmnWkfStore((s) => s.setId);
  const snackbar = useDmnSnackbarStore();
  const selectedElement = useDmnSelectionStore((s) => s.selectedElement);
  const rootElement = useDmnSelectionStore((s) => s.rootElement);
  const sel = {
    setSelectedElement: useDmnSelectionStore((s) => s.setSelectedElement),
    setDecision: useDmnSelectionStore((s) => s.setDecision),
    setInput: useDmnSelectionStore((s) => s.setInput),
    setOutput: useDmnSelectionStore((s) => s.setOutput),
    setInputIndex: useDmnSelectionStore((s) => s.setInputIndex),
    setOutputIndex: useDmnSelectionStore((s) => s.setOutputIndex),
    setRule: useDmnSelectionStore((s) => s.setRule),
    setInputRule: useDmnSelectionStore((s) => s.setInputRule),
    setRootElement: useDmnSelectionStore((s) => s.setRootElement),
    setTabs: useDmnSelectionStore((s) => s.setTabs),
    setTabValue: useDmnSelectionStore((s) => s.setTabValue),
  };

  const openPropertyPanelRef = useRef<(() => void) | null>(null);
  const openPropertyPanel = useCallback(() => { openPropertyPanelRef.current?.(); }, []);
  const { setupSheet } = useDmnSheet(dmnModeler, { openPropertyPanel });
  const handleSnackbarClick = useCallback(
    (messageType: string, message: string) => { snackbar.show(messageType, message); },
    [snackbar],
  );
  const handleSnackbarClose = useCallback(
    (_event: unknown, reason?: string) => { if (reason !== "clickaway") snackbar.close(); },
    [snackbar],
  );
  const drillDownSetWidth = useRef<((w: number) => void) | null>(null);
  const navigation = useDmnNavigation({
    dmnModelerRef, diagramXmlRef, handleSnackbarClick,
    wkfModel, id, rootElement, selectedElement, ...sel, openDialog, setWkfModel,
  });

  // Lifecycle (openDiagram, fetchDiagram, init, wireViewsChanged)
  const lifecycle = useDmnLifecycle({
    dmnModelerRef, diagramXmlRef, handleSnackbarClick,
    setWkfModel, setId, ...sel, setupSheet, openPropertyPanelRef,
    updateTabs: navigation.updateTabs,
  });

  // Patch fetchDiagram ref for navigation (user-triggered only, never during render)
  navigation.fetchDiagramRef.current = lifecycle.fetchDiagram;

  // Persistence (onSave, deploy, checkUniqueDecision)
  const persistence = useDmnPersistence({
    dmnModelerRef, diagramXmlRef, handleSnackbarClick,
    wkfModel, setWkfModel, openDialog, fetchDiagram: lifecycle.fetchDiagram,
  });

  // IO (export, import, upload)
  const io = useDmnIO({
    dmnModelerRef, handleSnackbarClick,
    wkfModel, id, setWkfModel, openDiagram: lifecycle.openDiagram,
  });

  type TI = { key: string; [k: string]: unknown };
  const leftToolbar: TI[] = useMemo(() => [
    { key: "save", iconOnly: true, description: translate("Save"), iconProps: { icon: "save" }, onClick: persistence.onSave },
    { key: "refresh", iconOnly: true, description: translate("Refresh"), iconProps: { icon: "refresh" }, tooltipText: "Refresh", onClick: navigation.onRefresh },
    { key: "deploy", iconOnly: true, description: translate("Deploy"), iconProps: { icon: "rocket" }, onClick: persistence.deployDiagram },
  ], [persistence.onSave, navigation.onRefresh, persistence.deployDiagram]);

  const rightToolbar: TI[] = useMemo(() => [
    { key: "upload", iconOnly: true, description: translate("Upload"), iconProps: { icon: "upload" }, onClick: () => document.getElementById("inputFile")?.click() },
    { key: "download", iconOnly: true, description: translate("Download"), iconProps: { icon: "download" }, onClick: io.exportDiagram },
    { key: "export", text: translate("Export"), onClick: io.exportExcel },
    { key: "import", text: translate("Import"), _isImportButton: true },
  ], [io.exportDiagram, io.exportExcel]);

  return {
    wkfModel, setWkfModel, id, setId, selectedElement, rootElement,
    handleSnackbarClick, handleSnackbarClose,
    getSelectValue: navigation.getSelectValue, getProperty: navigation.getProperty,
    getData: navigation.getData, getReadOnly: navigation.getReadOnly,
    openDiagram: lifecycle.openDiagram, fetchDiagram: lifecycle.fetchDiagram,
    initializeDiagram: lifecycle.initializeDiagram, wireViewsChanged: lifecycle.wireViewsChanged,
    onSave: persistence.onSave, onRefresh: navigation.onRefresh,
    deployDiagram: persistence.deployDiagram, exportDiagram: io.exportDiagram,
    uploadFile: io.uploadFile, importExcel: io.importExcel, exportExcel: io.exportExcel,
    uploadExcel: io.uploadExcel, uploadChunk: io.uploadChunk,
    handleViewDRD: navigation.handleViewDRD, reloadView: navigation.reloadView,
    updateTabs: navigation.updateTabs, leftToolbar, rightToolbar,
    diagramXmlRef, openPropertyPanelRef, drillDownSetWidth,
  };
}
