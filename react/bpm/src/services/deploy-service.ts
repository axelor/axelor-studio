// Pure deploy business logic extracted from BpmnModeler.jsx.
// No React imports, no UI side effects (snackbar, fetchDiagram, etc.).
// Returns structured {success, data/error} results.

import Service from "@studio/shared/services/Service";

import { deployWkfModel } from "./wkf-api";

import {  is } from "bpmn-js/lib/util/ModelUtil";

import { getDefinitionAttrs } from "../BPMN/Modeler/utils/modeler-api";
import { getBool } from "../utils";

interface WkfRecord {
  id?: number;
  version?: number;
  name?: string;
  statusSelect?: number;
  [key: string]: unknown;
}

interface DeployResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface OutputMappingResult {
  success: boolean;
  status: number;
  scripts?: Array<{ element: unknown; script: string }>;
}

import type { TypedBpmnModeler } from "@studio/shared/types";

/**
 * Builds the deploy context object from the wkf record and definition attrs.
 * The caller (hook orchestrator) is responsible for saving before deploy.
 */
export function prepareDeployContext(wkf: WkfRecord): Record<string, unknown> {
  // In the pure-function layer, we receive the wkf already enriched
  // getDefinitionAttrs is imported but not used here (no modeler ref available)
  void getDefinitionAttrs;

  return {
    _model: "com.axelor.studio.db.WkfModel",
    ...wkf,
  };
}

/**
 * Executes the deploy action via Service.action.
 * Extracted from BpmnModeler.jsx `deployAction`.
 */
export async function executeDeploy(
  context: Record<string, unknown>,
  _wkf: WkfRecord,
): Promise<DeployResult> {
  try {
    return await deployWkfModel(context);
  } catch (err) {
    return { success: false, error: (err as Error).message || "Error" };
  }
}

/**
 * Processes output mappings for all BusinessRuleTask elements.
 * Extracted from BpmnModeler.jsx `callOutoutMapping`.
 */
export async function callOutputMapping(
  modeler: TypedBpmnModeler,
): Promise<OutputMappingResult> {
  const elementRegistry = modeler.get("elementRegistry");

  const businessRuleElements = elementRegistry.filter(function (element) {
    return is(element, "bpmn:BusinessRuleTask");
  });

  if (!businessRuleElements || businessRuleElements.length <= 0) {
    return { success: true, status: -1 };
  }

  const elements =
    businessRuleElements &&
    businessRuleElements.filter(
      (e) =>
        e &&
        (e as Record<string, unknown>).businessObject &&
        ((e as Record<string, unknown>).businessObject as Record<string, unknown>).$attrs &&
        getBool(
          (
            ((e as Record<string, unknown>).businessObject as Record<string, unknown>)
              .$attrs as Record<string, unknown>
          )["camunda:assignOutputToFields"],
        ),
    );

  if (!elements || elements.length <= 0) {
    return { success: true, status: -1 };
  }

  const scripts: Array<{ element: unknown; script: string }> = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const bo = (element as Record<string, unknown>).businessObject as
      | Record<string, unknown>
      | undefined;
    if (element && bo) {
      const attrs = (bo.$attrs as Record<string, unknown>) || {};

      const ifMultiple = attrs["camunda:ifMultiple"];
      const searchWith = attrs["camunda:searchWith"];
      const resultVariable = bo.resultVariable;
      const decisionId = bo.decisionRef;
      const ctxModel = attrs["camunda:metaModelModelName"] || attrs["camunda:metaJsonModelModelName"];

      const context = {
        decisionId,
        ctxModel,
        searchWith,
        ifMultiple,
        resultVariable,
      };

      const actionResponse = await Service.action({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-dmn-model-method-create-output-to-field-script",
        data: {
          context,
        },
      });

      const values = actionResponse?.data?.[0]?.values as { script?: string } | undefined;
      if (values?.script) {
        scripts.push({ element, script: values.script });
      }
    }
  }

  return { success: true, status: 0, scripts };
}
