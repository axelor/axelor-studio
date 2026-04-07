import { useCallback } from "react";
import { translate } from "@studio/shared/i18n";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import { getElements } from "../extra";
import { saveCurrentWkf, resyncWkf } from "../../../services/wkf-repository";
import {
  fetchWkf,
  getBPMNModels,
} from "../../../shared/services";
import { getBool, convertSVGtoBase64 } from "../../../utils";
import {
  validateNameAndCode,
  validateTimerEvents,
  validateNodes,
} from "../../../services/validation-service";
import { executeSave } from "../../../services/save-service";
import { executeDeploy, callOutputMapping } from "../../../services/deploy-service";
import { createNewVersion, startWkfModel } from "../../../services/wkf-api";
import { getDefinitionAttrs, getProcesses } from "../utils/modeler-api";
import { wsProgress } from "../../../services/Progress";
import useWkfStore from "../stores/useWkfStore";
import { waitForConnection } from "./persistence-helpers";
import useSnackbarStore from "../stores/useSnackbarStore";
import type { WkfModel } from "../stores/useWkfStore";

import { applyOutputMappingScript } from "./apply-output-mapping";
import type { DiagramLifecycleReturn } from "./useDiagramLifecycle";
import type { DeployProgressResult } from "./useDeployProgress";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseDiagramPersistenceDeps {
  bpmnModelerRef: React.MutableRefObject<TypedBpmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  update: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  openDialog: (opts: Record<string, unknown>) => void;
  deployProgress: DeployProgressResult;
  // Cross-hook deps from lifecycle:
  fetchDiagram: DiagramLifecycleReturn["fetchDiagram"];
  newBpmnDiagram: DiagramLifecycleReturn["newBpmnDiagram"];
  addDiagramProperties: DiagramLifecycleReturn["addDiagramProperties"];
  isTimerTask: boolean;
}

export interface DiagramPersistenceReturn {
  onSave: () => Promise<void>;
  deploy: (wkfMigrationMap?: unknown, isMigrateOld?: boolean, newWkf?: WkfModel) => Promise<void>;
  handleOk: (wkfMigrationMap?: unknown, isMigrateOld?: boolean) => Promise<void>;
  deployDiagram: () => Promise<void>;
  addNewVersion: (wkfToVersion?: WkfModel) => Promise<WkfModel | undefined>;
  getNewVersionInfo: () => unknown;
  checkIfUpdated: () => Promise<boolean>;
  getBase64SVG: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Module-level helpers (pure functions, no hook state dependency)
// ---------------------------------------------------------------------------

/**
 * Validates that process IDs in the current diagram are unique
 * (not already used by another WkfModel). Returns true if valid, false if duplicate found.
 */
async function validateUniqueProcessIds(
  modeler: TypedBpmnModeler,
  wkf: WkfModel,
): Promise<boolean> {
  const processes = getProcesses(modeler);
  const processIds = processes.map((process: Record<string, unknown>) => process.id as string);
  if (!processIds || processIds.length === 0) return true;

  const isValidId = await getBPMNModels({
    data: {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: processIds,
        },
      ],
    },
    limit: 1,
  });

  const validArr = isValidId as unknown[] | null; // safety: Axelor REST validation response is dynamic array
  const wkfProcess = Array.isArray(validArr) && validArr.length > 0 ? validArr[0] : null;
  if (!wkfProcess) return true;
  if (wkf.previousVersion) return true;

  const processNames = wkf?.wkfProcessList?.map((f) => f.name) ?? [];
  const hasMatchingProcess = processNames.some(
    (item: string | undefined) => processIds.includes(item as string),
  );
  if (hasMatchingProcess) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDiagramPersistence(deps: UseDiagramPersistenceDeps): DiagramPersistenceReturn {
  const {
    bpmnModelerRef,
    diagramXmlRef,
    update,
    openDialog,
    deployProgress,
    fetchDiagram,
    newBpmnDiagram,
    addDiagramProperties,
    isTimerTask,
  } = deps;

  const { allowProgressBarDisplay } = deployProgress;

  // --- Snackbar helper ---
  const showSnackbar = useCallback((type: string, message: string) => {
    useSnackbarStore.getState().show(type, message);
  }, []);

  // ---------------------------------------------------------------------------
  // SVG export
  // ---------------------------------------------------------------------------

  const getBase64SVG = useCallback(async (): Promise<string | null> => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return null;
    const { svg } = await modeler.saveSVG({ format: true });
    return convertSVGtoBase64(svg);
  }, [bpmnModelerRef]);

  // ---------------------------------------------------------------------------
  // Dirty check
  // ---------------------------------------------------------------------------

  const checkIfUpdated = useCallback(async (): Promise<boolean> => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return false;
    const { xml } = (await modeler.saveXML({ format: true })) || {};
    const diagramXml = diagramXmlRef.current;
    return `${diagramXml}` !== `${xml}`;
  }, [bpmnModelerRef, diagramXmlRef]);

  // ---------------------------------------------------------------------------
  // Definition properties (for save payloads)
  // ---------------------------------------------------------------------------

  const getDefinitionProperties = useCallback((): Record<string, unknown> => {
    const modeler = bpmnModelerRef.current;
    const attrs = modeler ? getDefinitionAttrs(modeler) : ({} as Record<string, unknown>);
    return {
      name: attrs["camunda:diagramName"],
      code: attrs["camunda:code"],
      description: attrs["camunda:description"],
      newVersionOnDeploy: attrs["camunda:newVersionOnDeploy"],
      versionTag: attrs["camunda:versionTag"],
      wkfStatusColor: attrs["camunda:wkfStatusColor"],
    };
  }, [bpmnModelerRef]);

  const getNewVersionInfo = useCallback((): unknown => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return false;
    const attrs = getDefinitionAttrs(modeler);
    if (!attrs) return false;
    return attrs["camunda:newVersionOnDeploy"];
  }, [bpmnModelerRef]);

  // ---------------------------------------------------------------------------
  // Save (service-based approach from useSave.ts pattern)
  // ---------------------------------------------------------------------------

  const onSave = useCallback(async (): Promise<void> => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;

    const { wkf, showError, setShowError, setWkf, setId } = useWkfStore.getState();

    // Step 1: Validate name and code
    const nameCodeResult = validateNameAndCode(modeler);
    if (!nameCodeResult.success) {
      const { error: nameError } = nameCodeResult;
      if (nameError) {
        showSnackbar("danger", nameError);
      }
      setShowError(true);
      return;
    }
    if (showError) {
      setShowError(false);
    }

    // Step 2: Validate timer events
    const timerResult = validateTimerEvents(modeler, isTimerTask);
    if (!timerResult.success) {
      const { error: timerError } = timerResult;
      if (timerError) {
        showSnackbar("danger", timerError);
      }
      return;
    }

    // Step 3: Validate nodes
    const nodesResult = validateNodes(modeler);
    if (!nodesResult.success) {
      const { error: nodesError } = nodesResult;
      if (nodesError) {
        openDialog({
          title: "Error",
          message: nodesError,
        });
      }
      return;
    }

    // Step 4: Execute save via service
    const result = await executeSave(modeler, wkf as Record<string, unknown>);
    if (result.success) {
      const latestWkf = result.data as WkfModel;
      update((state) => ({ ...state, record: latestWkf }));

      // If version === 0, re-fetch to get server-side version bump
      if (latestWkf?.version === 0) {
        const res = await fetchWkf(latestWkf?.id as number | string);
        setWkf(res as WkfModel);
        setId((res as WkfModel).id ?? null);
        addDiagramProperties(res as WkfModel, false);
      } else {
        setWkf(latestWkf);
        setId(latestWkf.id ?? null);
        addDiagramProperties(latestWkf, false);
      }

      // Update diagram XML ref for dirty tracking
      const { xml } = await modeler.saveXML({ format: true });
      diagramXmlRef.current = xml;

      useWkfStore.getState().setDirty(false);
      showSnackbar("success", "Saved Successfully");
    } else {
      showSnackbar("danger", result.error ?? "Error");
    }
  }, [
    bpmnModelerRef,
    diagramXmlRef,
    isTimerTask,
    openDialog,
    update,
    showSnackbar,
    addDiagramProperties,
  ]);

  // ---------------------------------------------------------------------------
  // Deploy helpers
  // ---------------------------------------------------------------------------

  const addImage = useCallback(
    async (id: number | string): Promise<void> => {
      if (!id) return;
      const wkfData = (await fetchWkf(id)) || {};
      const bpmnImage = await getBase64SVG();
      const saveResult = await saveCurrentWkf({
        ...(wkfData as Record<string, unknown>),
        bpmnImage,
      });
      if (saveResult.ok) {
        const { diagramXml } = saveResult.data;
        newBpmnDiagram(diagramXml, true, id, saveResult.data);
      }
    },
    [getBase64SVG, newBpmnDiagram],
  );

  const deployAction = useCallback(
    async (context: unknown, newWkf: WkfModel): Promise<boolean> => {
      const result = await executeDeploy(
        context as Record<string, unknown>,
        newWkf as Record<string, unknown>,
      );
      if (result.success) {
        if (newWkf && newWkf.statusSelect !== 1) {
          await addImage(newWkf?.id as number | string);
          showSnackbar("success", "Deployed Successfully");
        }
        fetchDiagram(newWkf.id as number | string, true);
        return true;
      } else {
        showSnackbar("danger", result.error ?? "Error");
        // Resync store after deploy failure (PERSIST-03)
        await resyncWkf(newWkf.id as number | string);
        return false;
      }
    },
    [addImage, fetchDiagram, showSnackbar],
  );

  const startAction = useCallback(
    async (
      newWkf: WkfModel,
      wkfMigrationMap?: unknown,
      isDeploy: boolean = false,
      isMigrateOld?: boolean,
    ): Promise<void> => {
      const startResult = await startWkfModel(newWkf as Record<string, unknown>);
      if (startResult.success) {
        if (isDeploy) {
          await deployAction(
            {
              _model: "com.axelor.studio.db.WkfModel",
              ...newWkf,
              isMigrateOld,
              wkfMigrationMap,
            },
            newWkf,
          );
        } else {
          showSnackbar("success", "Started Successfully");
          fetchDiagram(newWkf.id as number | string, true);
        }
      } else {
        showSnackbar("danger", startResult.error ?? "Error");
      }
    },
    [deployAction, fetchDiagram, showSnackbar],
  );

  // ---------------------------------------------------------------------------
  // Version management
  // ---------------------------------------------------------------------------

  const addNewVersion = useCallback(
    async (wkfToVersion?: WkfModel): Promise<WkfModel | undefined> => {
      const wkf = wkfToVersion || useWkfStore.getState().wkf;
      const result = await createNewVersion(wkf as Record<string, unknown>);
      if (result.success) {
        const versionId = (result.data as { newVersionId?: number | string }).newVersionId;
        if (!versionId) return;
        useWkfStore.getState().setId(versionId);
        return await fetchDiagram(versionId);
      }
    },
    [fetchDiagram],
  );

  // ---------------------------------------------------------------------------
  // Deploy (service-based approach from useDeploy.ts pattern)
  // ---------------------------------------------------------------------------

  const deploy = useCallback(
    async (
      wkfMigrationMap?: unknown,
      isMigrateOld?: boolean,
      newWkf?: WkfModel,
    ): Promise<void> => {
      const wkf = newWkf || useWkfStore.getState().wkf;
      if (!wkf) return;

      // Check if migration is ongoing
      const wkfModel = (await fetchWkf(wkf.id as number | string)) as WkfModel;
      if (wkfModel.isMigrationOnGoing) {
        showSnackbar("danger", translate("Migration is already ongoing."));
        return;
      }

      const willCreateNewVersion = wkf?.newVersionOnDeploy && wkf?.statusSelect === 2;

      // Init WebSocket progress if applicable
      if (allowProgressBarDisplay && !willCreateNewVersion) {
        wsProgress.init(wkf.id as string | null);
        await waitForConnection();
      }

      try {
        // Build deploy context from the ALREADY SAVED wkf data
        const context: Record<string, unknown> = {
          _model: "com.axelor.studio.db.WkfModel",
          ...wkf,
          wkfMigrationMap,
        };
        if (
          (wkf?.statusSelect === 1 || getBool(getNewVersionInfo())) &&
          wkf?.oldNodes
        ) {
          context.isMigrateOld = isMigrateOld;
        }

        if (willCreateNewVersion) {
          const newVersionWkf = await addNewVersion(wkf);
          if (newVersionWkf && newVersionWkf.statusSelect === 1) {
            if (allowProgressBarDisplay) {
              wsProgress.init(newVersionWkf.id as string | null);
              await waitForConnection();
            }
            startAction(newVersionWkf, wkfMigrationMap, true, isMigrateOld);
          }
        } else {
          const deployResult = await deployAction(context, wkf);
          if (!deployResult) {
            return;
          }
        }

        if (wkf?.statusSelect === 1) {
          startAction(wkf);
        }
      } catch (err) {
        console.error("[DiagramPersistence] Error in deploy workflow:", err);
      }
    },
    [
      addNewVersion,
      startAction,
      deployAction,
      allowProgressBarDisplay,
      showSnackbar,
      getNewVersionInfo,
    ],
  );

  // ---------------------------------------------------------------------------
  // handleOk -- deploy dialog OK handler
  // ---------------------------------------------------------------------------

  const handleOk = useCallback(
    async (wkfMigrationMap?: unknown, isMigrateOld?: boolean): Promise<void> => {
      const modeler = bpmnModelerRef.current;
      if (!modeler) return;

      const wkf = useWkfStore.getState().wkf;
      useWkfStore.getState().setOpenDeployDialog(false);

      // Validate unique process IDs for new models
      if (wkf && wkf.statusSelect === 1) {
        const isValid = await validateUniqueProcessIds(modeler, wkf);
        if (!isValid) {
          showSnackbar("danger", "Please provide unique process id");
          return;
        }
      }

      // Call output mapping via service
      const mappingResult = await callOutputMapping(modeler);
      if (mappingResult.status === 0 && mappingResult.scripts) {
        for (const { element, script } of mappingResult.scripts) {
          applyOutputMappingScript(
            modeler,
            element as { businessObject: ModdleElement; [key: string]: unknown },
            script,
          );
        }
      }

      // Step 3: Single save via repository (always before deploy)
      try {
        const { xml } = await modeler.saveXML({ format: true });
        diagramXmlRef.current = xml;
        const defProps = getDefinitionProperties();
        const saveResult = await saveCurrentWkf({
          ...wkf,
          ...(defProps || {}),
          diagramXml: xml,
        } as Record<string, unknown>);

        if (!saveResult.ok) {
          showSnackbar("danger", saveResult.error.message);
          return;
        }

        // Step 4: Deploy with the saved data (no save inside deploy anymore)
        deploy(wkfMigrationMap, isMigrateOld, saveResult.data);
      } catch (err) {
        console.error("[DiagramPersistence] Error in save before deploy:", err);
      }
    },
    [bpmnModelerRef, diagramXmlRef, deploy, getDefinitionProperties, showSnackbar],
  );

  // ---------------------------------------------------------------------------
  // deployDiagram -- opens deploy dialog with current/old elements
  // ---------------------------------------------------------------------------

  const deployDiagram = useCallback(async (): Promise<void> => {
    const wkf = useWkfStore.getState().wkf;
    const modeler = bpmnModelerRef.current;
    if (!wkf || !modeler) return;
    const elements = getElements(modeler);
    const oldElements = JSON.parse(wkf.oldNodes as string);
    useWkfStore.getState().setIds({
      currentElements: elements,
      oldElements,
    });
    useWkfStore.getState().setOpenDeployDialog(true);
  }, [bpmnModelerRef]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    onSave,
    deploy,
    handleOk,
    deployDiagram,
    addNewVersion,
    getNewVersionInfo,
    checkIfUpdated,
    getBase64SVG,
  };
}
