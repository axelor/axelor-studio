// Service class and singleton
export { Service, ServiceInstance, getHeaders } from "./Service";

// Re-export default for backward compatibility (consumers using `import _Service from './Service'`)
export { default as ServiceDefault } from "./Service";

// Meta-model-service: model metadata
export { ModelType } from "./meta-model-service";
export {
  getModels,
  fetchModelByName,
  fetchModelByFullName,
  getMetaModels,
  getCustomModels,
  getMetaModel,
} from "./meta-model-service";

// Meta-field-service: field metadata
export type { FieldMetadata } from "./meta-field-service";
export {
  excludedUITypes,
  fetchMetaFields,
  fetchModelFields,
  fetchFields,
  fetchCustomFields,
  getResultedFields,
  getSubMetaField,
  getMetaFields,
  getNameColumn,
} from "./meta-field-service";

// Meta-view-service: view metadata
export { getViews, getFormViews, getItems } from "./meta-view-service";

// Model-service: model fetching (from bpm lineage, different signatures from meta-service)
// Aliased to avoid naming conflicts with meta-service exports
export {
  getModels as getModelsFromModelService,
  getMetaModels as getMetaModelsFromModelService,
  getCustomModels as getCustomModelsFromModelService,
  getAllModels,
} from "./model-service";

// App service
export {
  getStudioApp,
  getAppStudioConfig,
  getAppBPMConfig,
  getApp,
  getInfo,
  loadTheme,
} from "./app-service";

// Auth service
export { getRoles } from "./auth-service";

// Language service
export { getLanguages } from "./language-service";

// Menu service
export { getParentMenus, getSubMenus, getMenu } from "./menu-service";

// Template service
export { getTemplates } from "./template-service";

// Translation service
export { getTranslations, removeAllTranslations, addTranslations } from "./translation-service";

// Upload service
export { uploadFileAPI } from "./upload-service";

// DMN service
export { fetchDMNModel, getDMNModel, getDMNModels, getDMNFields } from "./dmn-service";

// WKF service (DMN models)
export { getWkfDMNModels } from "./wkf-service";

// Action service (buttons, expression values)
export { getButtons, getExpressionValues } from "./action-service";
