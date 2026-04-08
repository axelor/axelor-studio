// Pure save business logic extracted from BpmnModeler.jsx onSave.
// No React imports, no UI side effects (snackbar, setWkf, etc.).
// Returns structured {success, data/error} results.

import { getDefinitionAttrs } from "../BPMN/Modeler/utils/modeler-api";
import { getStudioApp } from "../shared/services";

import { saveWkfModel } from "./wkf-api";

interface WkfRecord {
  id?: number;
  version?: number;
  name?: string;
  [key: string]: unknown;
}

interface SaveResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

import type { TypedBpmnModeler } from "@studio/shared/types";

/**
 * Resolves the studioApp object from the definition attrs.
 * Returns undefined if no camunda:studioApp attr is set.
 */
async function resolveStudioApp(attrs: Record<string, unknown>): Promise<unknown> {
  if (!attrs["camunda:studioApp"]) return undefined;
  const res = (await getStudioApp({
    data: {
      criteria: [
        {
          fieldName: "code",
          operator: "=",
          value: attrs["camunda:studioApp"],
        },
      ],
      operator: "and",
    },
  })) as unknown[] | undefined; // safety: Axelor REST response shape is dynamic Record
  return res && res[0];
}

/**
 * Prepares the save payload from modeler state and current wkf record.
 * Serializes XML, reads definition attrs, resolves studioApp.
 */
export async function prepareSavePayload(
  modeler: TypedBpmnModeler,
  wkf: WkfRecord,
): Promise<Record<string, unknown>> {
  const { xml } = await modeler.saveXML({ format: true });
  const attrs = getDefinitionAttrs(modeler);
  const studioApp = await resolveStudioApp(attrs);

  return {
    ...wkf,
    diagramXml: xml,
    name: attrs["camunda:diagramName"],
    code: attrs["camunda:code"],
    wkfStatusColor: attrs["camunda:wkfStatusColor"] || "blue",
    versionTag: attrs["camunda:versionTag"],
    description: attrs["camunda:description"],
    studioApp,
  };
}

/**
 * Executes the save flow: prepares payload, delegates to saveWkfModel from wkf-api.
 */
export async function executeSave(modeler: TypedBpmnModeler, wkf: WkfRecord): Promise<SaveResult> {
  try {
    const payload = await prepareSavePayload(modeler, wkf);
    return await saveWkfModel(payload);
  } catch (err) {
    return { success: false, error: (err as Error).message || "Error" };
  }
}
