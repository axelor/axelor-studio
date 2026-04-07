import { useCallback } from "react";
import { migrateDiagram } from "@bpmn-io/dmn-migrate";
import type { DmnElement, WkfDmnModel } from "@studio/shared/types";
import { getDmnService } from "@studio/shared/types";
import { ServiceInstance as Service } from "@studio/shared/services";
import type { DmnModeler } from "dmn-js/lib/Modeler";

import { defaultDMNDiagram } from "../DMNModeler";

const fetchId = (): string | undefined => {
  const regexDMN = /[?&]id=([^&#]*)/g;
  const url = window.location.href;
  let matchDMNId: RegExpExecArray | null;
  while ((matchDMNId = regexDMN.exec(url))) {
    return matchDMNId[1];
  }
};

interface UseDmnLifecycleDeps {
  dmnModelerRef: React.MutableRefObject<DmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  handleSnackbarClick: (messageType: string, message: string) => void;
  setWkfModel: (model: WkfDmnModel) => void;
  setId: (id: string | number | null | undefined) => void;
  setRootElement: (el: DmnElement | null) => void;
  setDecision: (el: DmnElement | null) => void;
  setSelectedElement: (el: DmnElement | null) => void;
  setInput: (input: Record<string, unknown> | null) => void;
  setOutput: (output: Record<string, unknown> | null) => void;
  setInputIndex: (index: number | null) => void;
  setOutputIndex: (index: number | null) => void;
  setRule: (rule: Record<string, unknown> | null) => void;
  setInputRule: (rule: Record<string, unknown> | null) => void;
  setupSheet: () => void;
  openPropertyPanelRef: React.MutableRefObject<(() => void) | null>;
  updateTabs: (event: { element: DmnElement | undefined }) => void;
}

interface DmnLifecycleReturn {
  openDiagram: (dmnXML: string) => Promise<void>;
  fetchDiagram: (fetchIdParam: string | number | undefined, setWkf: (model: WkfDmnModel) => void) => Promise<void>;
  initializeDiagram: () => void;
  wireViewsChanged: () => void;
  newBpmnDiagram: (rec?: string) => void;
}

export function useDmnLifecycle(deps: UseDmnLifecycleDeps): DmnLifecycleReturn {
  const {
    dmnModelerRef,
    diagramXmlRef,
    setId,
    setRootElement,
    setDecision,
    setSelectedElement,
    openPropertyPanelRef,
    setupSheet,
    updateTabs,
  } = deps;

  const openDiagram = useCallback(
    async (dmnXML: string) => {
      const dmnModeler = dmnModelerRef.current;
      if (!dmnModeler) return;
      const dmn13XML = await migrateDiagram(dmnXML);
      dmnModeler
        .importXML(dmn13XML)
        .then(() => {
          diagramXmlRef.current = dmnXML;
          const activeView = dmnModeler.getActiveView();
          if (activeView && activeView.type === "drd") {
            const activeEditor = dmnModeler.getActiveViewer();
            const eventBus = activeEditor.get("eventBus");
            const canvas = activeEditor.get("canvas");
            canvas.zoom("fit-viewport");
            const drdViewer = dmnModeler._viewers?.drd;
            const elementRegistry = drdViewer ? getDmnService(drdViewer, "elementRegistry") : undefined;
            const rootEl =
              elementRegistry?.get(dmnModeler.getActiveView()?.id ?? "");
            setRootElement(rootEl ?? null);
            updateTabs({ element: rootEl });
            eventBus.on("drillDown.click", (event: { stopPropagation: () => void; element?: DmnElement }) => {
              event.stopPropagation();
              if (openPropertyPanelRef.current) {
                // Close drawer by setting width to 0
              }
              const { element } = event || {};
              setDecision(element ?? null);
              updateTabs({
                element: {
                  id: "__implicitroot",
                },
              });
            });
            eventBus.on("element.click", (event: { element: DmnElement }) => {
              const { element } = event;
              setSelectedElement(element);
              updateTabs(event);
            });
            eventBus.on(
              "commandStack.shape.replace.postExecuted",
              (event: { context?: { newShape?: DmnElement } }) => {
                updateTabs({
                  element: event?.context?.newShape,
                });
              },
            );
            eventBus.on("shape.removed", () => {
              const drdViewerInner = dmnModeler._viewers?.drd;
              const elementRegistry = drdViewerInner ? getDmnService(drdViewerInner, "elementRegistry") : undefined;
              const rootEl = elementRegistry?.get(dmnModeler.getActiveView()?.id ?? "");
              if (!rootEl) return;
              updateTabs({ element: rootEl });
            });
          }
        })
        .catch((err: unknown) => {
          console.error("[DmnModeler] could not import DMN 1.1 diagram", err);
          return;
        });
    },
    [dmnModelerRef, diagramXmlRef, setRootElement, setDecision, setSelectedElement, openPropertyPanelRef, updateTabs],
  );

  const newBpmnDiagram = useCallback(
    (rec?: string) => {
      const diagram = rec || defaultDMNDiagram;
      openDiagram(diagram);
    },
    [openDiagram],
  );

  const fetchDiagram = useCallback(
    async (
      fetchIdParam: string | number | undefined,
      setWkf: (model: WkfDmnModel) => void,
    ) => {
      if (fetchIdParam) {
        const res = await Service.fetchId<WkfDmnModel>("com.axelor.studio.db.WkfDmnModel", fetchIdParam, {
          related: {
            dmnTableList: ["name", "decisionId"],
          },
        });
        const wkf = res?.data?.[0] ?? {};
        const { diagramXml, id: wkfId } = wkf;
        setId(wkfId);
        setWkf(wkf);
        newBpmnDiagram(diagramXml);
      } else {
        newBpmnDiagram();
      }
    },
    [newBpmnDiagram, setId],
  );

  const initializeDiagram = useCallback(() => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    const urlId = fetchId();
    fetchDiagram(urlId, deps.setWkfModel);
    setId(urlId);
  }, [dmnModelerRef, fetchDiagram, deps.setWkfModel, setId]);

  const wireViewsChanged = useCallback(() => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    dmnModeler.on("views.changed", (event: { activeView?: { type: string } }) => {
      const { activeView } = event;
      if (activeView?.type === "decisionTable") {
        setupSheet();
      }
    });
  }, [dmnModelerRef, setupSheet]);

  return {
    openDiagram,
    fetchDiagram,
    initializeDiagram,
    wireViewsChanged,
    newBpmnDiagram,
  };
}
