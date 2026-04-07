import type { TypedBpmnModeler } from "@studio/shared/types";
import type React from "react";

import { getBool, getProblemViewData } from "../../../utils";
import { setColors } from "../utils/modeler-helpers";
import useWkfStore from "../stores/useWkfStore";

import { useModelerEvent } from "./useModelerEvent";

interface UseModelerEventsParams {
  bpmnModeler: TypedBpmnModeler | null;
  initialStateRef: React.RefObject<boolean>;
  checkIfUpdated: () => Promise<boolean>;
  update: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void;
  selectedElementRef: React.RefObject<unknown>;
  updateTabs: (event: { element: unknown }, isAllowComments?: boolean) => void;
  addCallActivityExtensionElement: (shape: unknown) => void;
  handleSnackbarClick: (messageType: string, message: string) => void;
  setIssues: (issues: { errors: unknown[]; warnings: unknown[] }) => void;
}

/**
 * Centralises ALL useModelerEvent subscriptions from BpmnModelerComponent
 * into a single hook.
 */
export default function useModelerEvents({
  bpmnModeler,
  initialStateRef,
  checkIfUpdated,
  update,
  selectedElementRef,
  updateTabs,
  addCallActivityExtensionElement,
  handleSnackbarClick,
  setIssues,
}: UseModelerEventsParams): void {
  // 1. elements.changed -- dirty tracking + linting activation
  useModelerEvent(
    "elements.changed",
    async () => {
      if (!initialStateRef.current) return;
      if (!bpmnModeler) return;
      const linting = bpmnModeler.get("linting");
      linting.toggle(true); // LINT-01/D-02: idempotent activation on first user edit
      const isDirty = await checkIfUpdated();
      useWkfStore.getState().setDirty(isDirty);
    },
    [bpmnModeler],
  );

  // 2. directEditing.complete -- update element state after inline edit
  useModelerEvent(
    "directEditing.complete",
    async () => {
      const isDirty = await checkIfUpdated();
      update((state) => ({
        ...state,
        element: selectedElementRef.current,
      }));
      useWkfStore.getState().setDirty(isDirty);
    },
    [],
  );

  // 3. commandStack.connection.create.postExecuted
  useModelerEvent(
    "commandStack.connection.create.postExecuted",
    (event: unknown) => {
      const evt = event as { context?: { target?: unknown; connection?: unknown } };
      const element = evt?.context?.target;
      if (bpmnModeler)
        setColors(evt?.context?.connection as Parameters<typeof setColors>[0], false, bpmnModeler);
      updateTabs({ element });
    },
    [bpmnModeler, updateTabs],
  );

  // 4. commandStack.shape.create.postExecuted
  useModelerEvent(
    "commandStack.shape.create.postExecuted",
    (event: unknown) => {
      const evt = event as { context?: { shape?: unknown } };
      const shape = evt?.context?.shape;
      if (bpmnModeler) setColors(shape as Parameters<typeof setColors>[0], false, bpmnModeler);
      addCallActivityExtensionElement(shape);
    },
    [bpmnModeler, addCallActivityExtensionElement],
  );

  // 5. commandStack.shape.replace.postExecuted
  useModelerEvent(
    "commandStack.shape.replace.postExecuted",
    (event: unknown) => {
      const evt = event as { context?: { newShape?: unknown } };
      if (bpmnModeler)
        setColors(evt?.context?.newShape as Parameters<typeof setColors>[0], true, bpmnModeler);
      updateTabs({
        element: evt?.context?.newShape,
      });
    },
    [bpmnModeler, updateTabs],
  );

  // 6. element.click
  useModelerEvent(
    "element.click",
    (event: unknown) => {
      const evt = event as { element: { type: string } };
      if (["bpmn:Collaboration", "bpmn:Process", "bpmn:SubProcess"].includes(evt.element.type)) {
        updateTabs(evt);
      }
    },
    [updateTabs],
  );

  // 7. selection.changed
  useModelerEvent(
    "selection.changed",
    (event: unknown) => {
      const evt = event as { newSelection: unknown[] };
      if (evt.newSelection.length > 0) {
        updateTabs({ element: evt.newSelection[0] });
      }
    },
    [updateTabs],
  );

  // 8. element.dblclick
  useModelerEvent(
    "element.dblclick",
    (event: unknown) => {
      const evt = event as { element: { businessObject: { $attrs?: Record<string, unknown> } } };
      const { element } = evt;
      const bo = element.businessObject;
      const isTranslation = (bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
      const isTranslated = getBool(isTranslation);
      if (isTranslated) {
        handleSnackbarClick(
          "danger",
          "Disable 'Add translations' property or add respective language translation to change label",
        );
        if (bpmnModeler) (bpmnModeler.get("directEditing") as { cancel(): void }).cancel();
      }
    },
    [bpmnModeler],
  );

  // 9. shape.removed
  useModelerEvent(
    "shape.removed",
    () => {
      if (!bpmnModeler) return;
      const elementRegistry = bpmnModeler.get("elementRegistry");
      const definitions = bpmnModeler.getDefinitions();
      const element = definitions && definitions.rootElements && definitions.rootElements[0];
      if (!element) return;
      const rootElement = elementRegistry.get(element.id as string);
      if (!rootElement) return;
      updateTabs({ element: rootElement });
    },
    [bpmnModeler, updateTabs],
  );

  // 10. linting.completed
  useModelerEvent(
    "linting.completed",
    (event: unknown) => {
      const evt = event as { issues?: unknown };
      const issuesData = getProblemViewData(evt?.issues as Record<string, unknown> | undefined);
      setIssues(issuesData);
    },
    [],
  );
}
