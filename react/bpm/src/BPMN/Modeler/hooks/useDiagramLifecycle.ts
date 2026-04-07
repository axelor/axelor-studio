import React, { useCallback, useRef, useState } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler, ModdleElement } from "@studio/shared/types";

import {
  fetchId,
  getTabs,
  addOldNodes,
  getCommentsLength,
} from "../extra";
import { fetchWkf } from "../../../shared/services";
import { isConditionalSource, nextId } from "../utils/modeler-helpers";
import { processColors, updateTranslations } from "./diagram-helpers";
import useWkfStore from "../stores/useWkfStore";
import useSelectionStore from "../stores/useSelectionStore";
import useSnackbarStore from "../stores/useSnackbarStore";
import useTabStore from "../stores/useTabStore";
import type { TabItem } from "../stores/useTabStore";
import type { WkfModel } from "../stores/useWkfStore";


/** Loose element type for legacy code that accesses element properties dynamically */
interface LegacyElement {
  id?: string;
  type?: string;
  $type?: string;
  $parent?: LegacyElement;
  businessObject?: Record<string, unknown> & {
    $attrs?: Record<string, unknown>;
    id?: string;
    name?: string;
    extensionElements?: { values: unknown[] };
  };
  di?: { stroke?: string; fill?: string };
  constructor?: { name: string };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Module-level helpers (pure functions, no hook state dependency)
// ---------------------------------------------------------------------------

type SetPropertyFn = (name: string, value: unknown, isInitial?: boolean) => void;

/**
 * Configuration map: WKF model key -> [target property name, value resolver].
 * Replaces forEach+if/else chain for WKF property mapping.
 */
const WKF_PROPERTY_MAP: Record<string, (wkf: WkfModel) => [string, unknown]> = {
  code: (wkf) => ["code", wkf.code],
  name: (wkf) => ["diagramName", wkf.name],
  versionTag: (wkf) => ["versionTag", wkf.versionTag],
  studioApp: (wkf) => ["studioApp", wkf.studioApp && (wkf.studioApp as Record<string, unknown>)?.code],
  description: (wkf) => ["description", wkf.description],
  wkfStatusColor: (wkf) => ["wkfStatusColor", wkf.wkfStatusColor],
  newVersionOnDeploy: (wkf) => ["newVersionOnDeploy", wkf.newVersionOnDeploy],
};

function applyWkfProperties(
  wkf: WkfModel,
  setPropertyFn: SetPropertyFn,
  isInitial: boolean = false,
  keys?: string[],
): void {
  const entries = keys
    ? Object.entries(WKF_PROPERTY_MAP).filter(([k]) => keys.includes(k))
    : Object.entries(WKF_PROPERTY_MAP);
  for (const [, resolver] of entries) {
    const [propName, value] = resolver(wkf);
    setPropertyFn(propName, value, isInitial);
  }
}

function initializeElementAttributes(
  element: LegacyElement,
  modeler: TypedBpmnModeler,
  info: Record<string, unknown> | null,
): void {
  if (!element) return;
  if (!["Shape", "Root"].includes((element.constructor as { name: string })?.name ?? "")) {
    updateTranslations(element, modeler, info);
    return;
  }
  const bo = element.businessObject;
  if (!bo) return;
  if (isConditionalSource(element)) return;
  if (bo.$attrs?.["camunda:displayStatus"] === "false") return;
  if (
    bo.$attrs &&
    (bo.$attrs["camunda:displayStatus"] === undefined ||
      bo.$attrs["camunda:displayStatus"] === null)
  ) {
    bo.$attrs["camunda:displayStatus"] = true;
  }
  updateTranslations(element, modeler, info);
}

interface UseDiagramLifecycleDeps {
  bpmnModelerRef: React.MutableRefObject<TypedBpmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  update: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  info: Record<string, unknown> | null;
}

export interface DiagramLifecycleReturn {
  openBpmnDiagram: (xml: string, isDeploy?: boolean, id?: number | string, oldWkf?: WkfModel) => Promise<void>;
  newBpmnDiagram: (rec?: string, isDeploy?: boolean, id?: number | string, oldWkf?: WkfModel) => void;
  fetchDiagram: (id?: number | string, isDeploy?: boolean) => Promise<WkfModel | undefined>;
  initializeDiagram: () => void;
  uploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addDiagramProperties: (wkf?: WkfModel, resetElement?: boolean) => void;
  updateTabs: (event: { element: unknown }, isAllowComments?: boolean) => void;
  addNewDiagram: () => void;
  initialState: boolean;
  isTimerTask: boolean;
}

/**
 * Domain hook owning the "bootstrap" domain: opening, creating, fetching,
 * importing XML diagrams.
 *
 * All callbacks read bpmnModelerRef.current (never capture bpmnModeler directly)
 * to avoid stale closures (per Guard #2).
 */
export function useDiagramLifecycle({
  bpmnModelerRef,
  diagramXmlRef,
  update,
  info,
}: UseDiagramLifecycleDeps): DiagramLifecycleReturn {
  // --- Local state ---
  const [isTimerTask, setIsTimerTask] = useState(true);

  // --- Race condition guard (pattern from useDiagram.ts) ---
  const generationRef = useRef(0);

  // --- Snackbar helper ---
  const handleSnackbarClick = useCallback((messageType: string, message: string) => {
    useSnackbarStore.getState().show(messageType, message);
  }, []);

  // --- getProperty ---
  const getProperty = (element: unknown, name: string): string => {
    const propertyName = `camunda:${name}`;
    let bo = getBusinessObject(element);
    if ((element && (element as LegacyElement).type) === "bpmn:Participant") {
      bo = getBusinessObject(bo && bo.processRef);
    }
    return (bo && bo.$attrs && bo.$attrs[propertyName]) || "";
  };

  // --- setProperty ---
  const setProperty = (name: string, value: unknown, isInitial: boolean = false): void => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const definitions = modeler.getDefinitions();
    const attrs = definitions && definitions.$attrs;
    if (attrs) {
      const newValue =
        !["null", ""].includes(attrs[`camunda:${name}`] as string) &&
        isInitial &&
        !["null", "", null, undefined].includes(value as string | null | undefined)
          ? value
          : attrs[`camunda:${name}`]
            ? attrs[`camunda:${name}`]
            : !["null", "", null, undefined].includes(value as string | null | undefined)
              ? value
              : undefined;
      attrs[`camunda:${name}`] = newValue;
      if (!newValue && name !== "newVersionOnDeploy") {
        delete attrs[`camunda:${name}`];
        return;
      }
    }
  };

  // --- checkMenuActionTab ---
  const checkMenuActionTab = useCallback((element: { type?: string } | null) => {
    if (!element) return;
    const USER_TASKS_TYPES_INLINE = [
      "bpmn:UserTask",
      "bpmn:ManualTask",
      "bpmn:SendTask",
      "bpmn:ReceiveTask",
    ];
    if (USER_TASKS_TYPES_INLINE.includes(element.type ?? "")) {
      const metaModel = getProperty(element, "metaModel");
      const metaJsonModel = getProperty(element, "metaJsonModel");
      if (!metaJsonModel && !metaModel) {
        useSelectionStore.getState().setMenuActionDisable(true);
      } else {
        useSelectionStore.getState().setMenuActionDisable(false);
      }
    } else {
      useSelectionStore.getState().setMenuActionDisable(false);
    }
  }, []);

  // --- updateTabs ---
  const updateTabs = useCallback(
    (event: { element: unknown }, isAllowComments: boolean = true) => {
      const modeler = bpmnModelerRef.current;
      if (!modeler) return;
      let element = event.element as LegacyElement;
      if (element && element.type === "label") {
        const elementRegistry = modeler.get("elementRegistry");
        const newElement = elementRegistry.get(
          (element.businessObject && element.businessObject.id) ?? "",
        );
        element = newElement as LegacyElement;
      }
      const tabs = getTabs(modeler, element);
      useTabStore.getState().setTabValue(0);
      useTabStore.getState().setTabs(tabs as unknown as TabItem[]); // safety: bpmn-js tab shapes differ from TabItem interface
      useSelectionStore.getState().setSelectedElement(element as ModdleElement);
      if (isAllowComments) {
        const commentsLength = getCommentsLength(element);
        useSelectionStore.getState().setComments(commentsLength);
        checkMenuActionTab(element as { type?: string });
      }
    },
    [checkMenuActionTab],
  );

  // --- getQueryParamValue ---
  const getQueryParamValue = (key: string = ""): string | null => {
    const params = new URL(document.location.href).searchParams;
    return params.get(key);
  };

  // --- openBpmnDiagram ---
  const openBpmnDiagram = useCallback(
    async (xml: string, isDeploy?: boolean, id?: number | string, oldWkf?: WkfModel): Promise<void> => {
      const modeler = bpmnModelerRef.current;
      if (!modeler) return;
      try {
        await modeler.importXML(xml);
        diagramXmlRef.current = xml;
        if (isDeploy) {
          addOldNodes(
            oldWkf as Record<string, unknown>,
            modeler,
          );
        }
        const canvas = modeler.get("canvas");
        canvas.zoom("fit-viewport");
        const definitions = modeler.getDefinitions();
        const attrs = definitions && definitions.$attrs;
        if (attrs) {
          if (oldWkf) {
            applyWkfProperties(oldWkf, setProperty, true);
          }
        }
        const tabs = getTabs(modeler, definitions);
        useTabStore
          .getState()
          .setTabs(tabs as unknown as TabItem[]); // safety: bpmn-js tab shapes differ from TabItem interface
        useTabStore.getState().setTabValue(0);
        const focusedNodeId = getQueryParamValue("node");
        const focusedNode = focusedNodeId
          ? modeler.get("elementRegistry").get(focusedNodeId)
          : null;
        if (focusedNode) {
          const selectionService = modeler.get("selection");
          selectionService?.select(focusedNode);
          updateTabs({
            element: focusedNode,
          });
        } else {
          useSelectionStore.getState().setSelectedElement(definitions);
        }
        const elementRegistry = modeler.get("elementRegistry");
        const modeling = modeler.get("modeling");
        const allElements = elementRegistry ? elementRegistry.getAll() : [];
        if (!allElements.length) return;
        allElements.forEach((element: LegacyElement) =>
          initializeElementAttributes(element, modeler, info),
        );

        try {
          await processColors(allElements as LegacyElement[], modeling);
          const { xml } = await modeler.saveXML({ format: true });
          diagramXmlRef.current = xml;
          useWkfStore.getState().setInitialState(true);
          useWkfStore.getState().setDirty(false);
        } catch (error) {
          console.error("[DiagramLifecycle] Error saving XML:", error);
        }
      } catch (error) {
        handleSnackbarClick("danger", "Error! Can't import XML" + error);
      }
    },
    [],
  );

  // --- newBpmnDiagram ---
  const newBpmnDiagram = useCallback(
    function newBpmnDiagram(
      rec?: string,
      isDeploy?: boolean,
      id?: number | string,
      oldWkf?: WkfModel,
    ): void {
      const processId = nextId();
      const diagram =
        rec ||
        `<?xml version="1.0" encoding="UTF-8" ?>
      <bpmn2:definitions
        xmlns:xs="http://www.w3.org/2001/XMLSchema-instance"
        xs:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
        id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn"
        camunda:newVersionOnDeploy="false">
        <bpmn2:process id="${processId}" isExecutable="true">
          <bpmn2:startEvent id="StartEvent_1" />
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
            <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1" bioc:stroke="#55c041" bioc:fill="#ccecc6">
              <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0" />
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn2:definitions>`;
      openBpmnDiagram(diagram, isDeploy, id, oldWkf);
    },
    [openBpmnDiagram],
  );

  // --- fetchDiagram (with generationRef race condition guard) ---
  const fetchDiagram = useCallback(
    async function fetchDiagram(
      id?: number | string,
      isDeploy: boolean = false,
    ): Promise<WkfModel | undefined> {
      const generation = ++generationRef.current;

      if (id) {
        const wkf = ((await fetchWkf(id)) || {}) as WkfModel;

        // Discard stale result if diagram ID changed during fetch
        if (generationRef.current !== generation) return;

        const { diagramXml } = wkf;
        useWkfStore.getState().setWkf(wkf);
        update((state) => ({ ...state, record: wkf }));
        newBpmnDiagram(diagramXml, isDeploy, id, wkf);
        return wkf;
      } else {
        newBpmnDiagram(undefined, isDeploy, id);
      }
    },
    [newBpmnDiagram, update],
  );

  // --- uploadFile ---
  const uploadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (!files?.length) return;
    const reader = new FileReader();
    if (files[0].name && !files[0].name.includes(".bpmn")) {
      handleSnackbarClick("danger", "Upload Bpmn files only");
      // Reset input so the same file can be re-selected
      e.target.value = "";
      return;
    }
    reader.readAsText(files[0]);
    reader.onload = (evt) => {
      openBpmnDiagram(evt.target?.result as string, false);
    };
    // Reset input so the same file can be selected again (e.g. after "New")
    e.target.value = "";
  }, [openBpmnDiagram, handleSnackbarClick]);

  // --- addNewDiagram ---
  const addNewDiagram = useCallback((): void => {
    useWkfStore.getState().setInitialState(false);
    useWkfStore.getState().setDirty(false);
    useWkfStore.getState().setWkf(null);
    update((state) => ({ ...state, record: null }));
    useWkfStore.getState().setId(null);
    newBpmnDiagram();
  }, [newBpmnDiagram, update]);

  // --- addDiagramProperties ---
  const addDiagramProperties = (wkfParam?: WkfModel, resetElement: boolean = true): void => {
    const modeler = bpmnModelerRef.current;
    if (!modeler) return;
    const wkf = wkfParam || useWkfStore.getState().wkf;
    const definitions = modeler.getDefinitions();
    const attrs = definitions && definitions.$attrs;
    if (attrs) {
      if (wkf) {
        applyWkfProperties(wkf, setProperty, false, ["code", "name", "versionTag", "studioApp", "description", "wkfStatusColor"]);
      }
    }
    if (resetElement) {
      updateTabs(
        {
          element: definitions,
        },
        false,
      );
    }
  };

  // --- initializeDiagram ---
  const initializeDiagram = useCallback((): void => {
    const { id, timerTask } = fetchId();
    useWkfStore.getState().setId(id ?? null);
    setIsTimerTask(timerTask);
    fetchDiagram(id);
  }, [fetchDiagram]);

  return {
    openBpmnDiagram,
    newBpmnDiagram,
    fetchDiagram,
    initializeDiagram,
    uploadFile,
    addDiagramProperties,
    updateTabs,
    addNewDiagram,
    initialState: useWkfStore((s) => s.initialState),
    isTimerTask,
  };
}
