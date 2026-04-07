// Transition barrel: re-exports promoted services from @studio/shared/services
// and keeps bpm-local services (action-service, bpmn-process-service, wkf-service, connect-service)

// Promoted to @studio/shared: meta-service
// NOTE: getMetaModal is the old typo name. The shared version uses getMetaModel (fixed).
// Re-export as getMetaModal for backward compatibility during transition.
export {
  getMetaModel as getMetaModal,
  getSubMetaField,
  getMetaFields,
  getItems,
  getViews,
  getNameColumn,
  getResultedFields,
} from "@studio/shared/services";

// Promoted to @studio/shared: model-service
// model-service functions in shared are aliased to avoid conflicts with meta-service.
// Re-export them here under their original bpm names.
export {
  getModelsFromModelService as getModels,
  getMetaModelsFromModelService as getMetaModels,
  getCustomModelsFromModelService as getCustomModels,
  getAllModels,
} from "@studio/shared/services";

// fetchModels stays local (depends on BPM-specific getProcessConfig)
export { fetchModels } from "./model-service";

// Promoted to @studio/shared: menu-service
export { getParentMenus, getSubMenus, getMenu } from "@studio/shared/services";

// Promoted to @studio/shared: translation-service
export { getTranslations, removeAllTranslations, addTranslations } from "@studio/shared/services";

// Promoted to @studio/shared: dmn-service
export { fetchDMNModel, getDMNModel, getDMNModels, getDMNFields } from "@studio/shared/services";

// Promoted to @studio/shared: app-service
export {
  getStudioApp,
  getAppStudioConfig,
  getAppBPMConfig,
  getApp,
  getInfo,
  loadTheme,
} from "@studio/shared/services";

// Promoted to @studio/shared: auth-service
export { getRoles } from "@studio/shared/services";

// Promoted to @studio/shared: upload-service
export { uploadFileAPI } from "@studio/shared/services";

// Promoted to @studio/shared: language-service
export { getLanguages } from "@studio/shared/services";

// Promoted to @studio/shared: template-service
export { getTemplates } from "@studio/shared/services";

// ---- BPM-local services (NOT promoted) ----

// action-service: getActions stays local; getButtons, getExpressionValues promoted to shared
export { getActions } from "./action-service";
export { getButtons, getExpressionValues } from "@studio/shared/services";

export { checkConnectAndStudioInstalled, getOrganization, getScenarios } from "./connect-service";

// wkf-service: getWkfDMNModels promoted to shared; rest stays local
export {
  getWkfModels,
  fetchWkf,
  removeWkf,
  getProcessConfigModel,
  getProcessInstance,
} from "./wkf-service";
export { getWkfDMNModels } from "@studio/shared/services";

export { getBPMNModels } from "./bpmn-process-service";
