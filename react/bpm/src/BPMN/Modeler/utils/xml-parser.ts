// Lightweight XML parsing via bpmn-moddle.
// Replaces temporary BpmnModeler instances that were created just to read
// rootElements from XML (e.g., in MessageEventDefinition, SignalEventDefinition).
// Uses bpmn-moddle standalone -- no full modeler, no canvas, no DI overhead.

import { BpmnModdle } from "bpmn-moddle";
import camundaModdle from "camunda-bpmn-moddle/resources/camunda.json";
import type { ModdleElement } from "@studio/shared/types";

const moddle = new BpmnModdle({ camunda: camundaModdle });

/**
 * Parses BPMN XML and returns the rootElements array.
 */
export async function parseXmlRootElements(xml: string): Promise<ModdleElement[]> {
  const { rootElement } = await moddle.fromXML(xml);
  return (rootElement as unknown as { rootElements?: ModdleElement[] }).rootElements || []; // safety: bpmn-js rootElement lacks rootElements in typed interface
}

/**
 * Returns bpmn:Message elements from XML that do NOT have a camunda:modelRefCode.
 */
export async function getMessagesFromXml(xml: string): Promise<ModdleElement[]> {
  const rootElements = await parseXmlRootElements(xml);
  return rootElements.filter(
    (r) => r.$type === "bpmn:Message" && !r.$attrs?.["camunda:modelRefCode"],
  );
}
