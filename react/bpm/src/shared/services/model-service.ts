/**
 * BPM-local model-service: only fetchModels (depends on BPM-specific getProcessConfig).
 * Generic model functions (getModels, getMetaModels, getCustomModels, getAllModels)
 * are now in @studio/shared/services/model-service.js.
 */
import { getModelsFromModelService as getModels } from "@studio/shared/services";

import { getProcessConfig } from "../../components/expression-builder/extra/util";

export function fetchModels(
  element: unknown,
  processConfigs?: unknown,
): ReturnType<typeof getModels> {
  return getModels(
    (getProcessConfig(element as Record<string, unknown>, processConfigs as string[] | undefined) ??
      undefined) as Record<string, unknown> | undefined,
    undefined,
  );
}
