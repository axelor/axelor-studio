import { useCallback, useRef } from "react";
import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil.js";
import type { WkfDmnModel, DmnElement } from "@studio/shared/types";
import { getDmnService } from "@studio/shared/types";
import { splitWithComma, mergeModels } from "@studio/shared/utils";
import type { DmnModeler } from "dmn-js/lib/Modeler";
import propertiesTabs from "../properties/properties";
import { translate } from "@studio/shared/i18n";
import type { DmnPropertyGroup } from "../properties/types";

interface DmnTab { id: string; label: string; groups: DmnPropertyGroup[]; [key: string]: unknown }

function getTabs(dmnModeler: DmnModeler, element: DmnElement | undefined): DmnTab[] | undefined {
  const activeEditor = dmnModeler?.getActiveViewer();
  if (!activeEditor || !element) return;
  const tabs = propertiesTabs(element, translate, dmnModeler);
  return tabs?.filter((t: DmnTab) => t && t.id === "general") ?? [];
}

export interface UseDmnNavigationDeps {
  dmnModelerRef: React.MutableRefObject<DmnModeler | null>;
  diagramXmlRef: React.MutableRefObject<string | null>;
  handleSnackbarClick: (messageType: string, message: string) => void;
  wkfModel: WkfDmnModel | null;
  id: string | number | null | undefined;
  rootElement: DmnElement | null;
  selectedElement: DmnElement | null;
  setSelectedElement: (el: DmnElement | null) => void;
  setDecision: (el: DmnElement | null) => void;
  setRootElement: (el: DmnElement | null) => void;
  setTabs: (tabs: DmnTab[] | null) => void;
  setTabValue: (value: number) => void;
  setInput: (input: Record<string, unknown> | null) => void;
  setOutput: (output: Record<string, unknown> | null) => void;
  setInputIndex: (index: number | null) => void;
  setOutputIndex: (index: number | null) => void;
  setRule: (rule: Record<string, unknown> | null) => void;
  setInputRule: (rule: Record<string, unknown> | null) => void;
  openDialog: (opts: { title: string; message: string; onSave: () => void }) => void;
  setWkfModel: (model: WkfDmnModel) => void;
}

interface DmnNavigationReturn {
  handleViewDRD: () => void;
  reloadView: () => void;
  onRefresh: () => Promise<void>;
  updateTabs: (event: { element: DmnElement | undefined }) => void;
  getSelectValue: (name: string) => string[] | undefined;
  getProperty: (name: string) => unknown;
  getData: () => Record<string, unknown>[] | undefined;
  getReadOnly: (entry: Record<string, unknown>) => boolean;
  /** Ref patched by facade after lifecycle creation to break circular dep. */
  fetchDiagramRef: React.MutableRefObject<((id: string | number | undefined, setWkf: (m: WkfDmnModel) => void) => Promise<void>) | null>;
}

export function useDmnNavigation(deps: UseDmnNavigationDeps): DmnNavigationReturn {
  const { dmnModelerRef, diagramXmlRef, wkfModel, id, rootElement, selectedElement,
    setSelectedElement, setDecision, setRootElement, setTabs, setTabValue,
    setInput, setOutput, setInputIndex, setOutputIndex, setRule, setInputRule,
    openDialog, setWkfModel } = deps;

  // Ref-based bridge for fetchDiagram (set by facade after lifecycle hook is created)
  const fetchDiagramRef = useRef<((id: string | number | undefined, setWkf: (m: WkfDmnModel) => void) => Promise<void>) | null>(null);

  const getSelectValue = useCallback((name: string): string[] | undefined => {
    const bo = rootElement?.businessObject;
    const attrs = bo?.$attrs as Record<string, unknown> | undefined;
    if (!bo || !name || !attrs) return;
    return splitWithComma(attrs[`camunda:${name}`] as string);
  }, [rootElement]);

  const getProperty = useCallback((name: string): unknown => {
    const bo = rootElement?.businessObject;
    const attrs = bo?.$attrs as Record<string, unknown> | undefined;
    if (!bo || !name || !attrs) return;
    return attrs[`camunda:${name}`];
  }, [rootElement]);

  const getModels = useCallback(
    (model: string[], type: string, titles: string[] | undefined): Array<Record<string, unknown>> => {
      const fullNames = type === "metaModel" && getSelectValue("metaModelModelNames");
      return model.map((m, i) => ({
        fullName: type === "metaModel" && fullNames && fullNames[i],
        name: m, type, title: titles?.[i],
      }));
    }, [getSelectValue]);

  const findModels = useCallback((name: string): Array<Record<string, unknown>> | undefined => {
    const models = getSelectValue(`${name}s`) || [];
    if (!models?.length) return;
    return getModels(models, name, getSelectValue(`${name}Labels`));
  }, [getSelectValue, getModels]);

  const getData = useCallback((): Record<string, unknown>[] | undefined => {
    return mergeModels(findModels("metaModel"), findModels("metaJsonModel"));
  }, [findModels]);

  const updateTabs = useCallback((event: { element: DmnElement | undefined }) => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    let { element } = event;
    if (element && element.type === "label") {
      const activeEditor = dmnModeler.getActiveViewer();
      element = activeEditor.get("elementRegistry").get(element.businessObject?.id);
    }
    const tabs = getTabs(dmnModeler, element);
    setTabValue(0);
    setTabs(tabs ?? null);
    setSelectedElement(element ?? null);
  }, [dmnModelerRef, setTabValue, setTabs, setSelectedElement]);

  const getReadOnly = useCallback((entry: Record<string, unknown>): boolean => {
    const decisionId = getBusinessObject(selectedElement)?.id;
    const list = wkfModel?.dmnTableList;
    if (decisionId && list && entry?.modelProperty === "id") {
      return Boolean(list.find((item: { decisionId?: string }) => item.decisionId === decisionId));
    }
    return false;
  }, [selectedElement, wkfModel]);

  const handleViewDRD = useCallback(() => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    const views = dmnModeler.getViews();
    const drdView = views.find(({ type }: { type: string }) => type === "drd");
    if (drdView) dmnModeler.open(drdView);
    const drdViewer = dmnModeler._viewers?.drd;
    const elementRegistry = drdViewer ? getDmnService(drdViewer, "elementRegistry") : undefined;
    const newElement = elementRegistry?.get(dmnModeler?.getDefinitions()?.id ?? "");
    setRootElement(newElement ?? null);
    setDecision(null);
    setSelectedElement(newElement ?? null);
    setInput(null); setInputIndex(null); setOutput(null); setOutputIndex(null);
    setRule(null); setInputRule(null);
    updateTabs({ element: newElement });
  }, [dmnModelerRef, updateTabs, setRootElement, setDecision, setSelectedElement, setInput, setInputIndex, setOutput, setOutputIndex, setRule, setInputRule]);

  const reloadView = useCallback(() => {
    fetchDiagramRef.current?.(id ?? undefined, setWkfModel);
    setInput(null); setInputRule(null); setOutput(null); setRule(null);
  }, [id, setWkfModel, setInput, setInputRule, setOutput, setRule]);

  const onRefresh = useCallback(async () => {
    const dmnModeler = dmnModelerRef.current;
    if (!dmnModeler) return;
    dmnModeler.saveXML({ format: true }, function (_err: Error | null, xml: string) {
      if (`${diagramXmlRef.current}` !== `${xml}`) {
        openDialog({ title: "Refresh", message: "Current changes will be lost. Do you really want to proceed?", onSave: reloadView });
      } else {
        reloadView();
      }
    });
  }, [dmnModelerRef, diagramXmlRef, openDialog, reloadView]);

  return {
    handleViewDRD, reloadView, onRefresh, updateTabs,
    getSelectValue, getProperty, getData, getReadOnly, fetchDiagramRef,
  };
}
