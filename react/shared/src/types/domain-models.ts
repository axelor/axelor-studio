/**
 * Domain model interfaces for Axelor entities used across BPM/DMN apps.
 *
 * Convention:
 * - All entity interfaces extend AxelorEntity (required id, optional version).
 * - All non-id/version fields are optional (backend may return partial projections).
 * - ViewElement is a UI structure (not a persistent entity) and does NOT extend AxelorEntity.
 *
 * @module domain-models
 */

/** Base interface for all Axelor persistent entities. */
export interface AxelorEntity {
  id: number;
  version?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Workflow (BPM) entities
// ---------------------------------------------------------------------------

export interface WkfModel extends AxelorEntity {
  name?: string;
  code?: string;
  diagramXml?: string;
  statusSelect?: number;
  isActive?: boolean;
  wkfProcessList?: WkfProcess[];
  description?: string;
  previousVersion?: WkfModel;
  newVersionId?: number;
}

export interface WkfProcess extends AxelorEntity {
  name?: string;
  wkfModel?: Pick<WkfModel, "id" | "name">;
}

export interface WkfInstance extends AxelorEntity {
  instanceId?: string;
  currentError?: string;
  wkfProcess?: Pick<WkfProcess, "id" | "name">;
}

// ---------------------------------------------------------------------------
// DMN entities
// ---------------------------------------------------------------------------

export interface WkfDmnModel extends AxelorEntity {
  name?: string;
  dmnTableList?: DmnTable[];
  diagramXml?: string;
}

export interface DmnTable extends AxelorEntity {
  decisionId?: string;
  name?: string;
}

export interface DmnField extends AxelorEntity {}

// ---------------------------------------------------------------------------
// Meta (metadata) entities
// ---------------------------------------------------------------------------

export interface MetaModel extends AxelorEntity {
  name?: string;
  fullName?: string;
  packageName?: string;
  title?: string;
  metaFields?: MetaField[];
}

export interface MetaField extends AxelorEntity {
  name?: string;
  type?: string;
  typeName?: string;
  label?: string;
  title?: string;
  relationship?: string;
  target?: string;
  targetName?: string;
  packageName?: string;
  nameColumn?: boolean;
  required?: boolean;
  json?: boolean;
  sequence?: number;
  model?: string;
  targetModel?: string;
  targetJsonModel?: string;
  modelField?: string;
  jsonModel?: string;
  selection?: string;
  selectionList?: MetaSelectItem[];
  metaModel?: Pick<MetaModel, "id" | "name">;
}

export interface MetaView extends AxelorEntity {
  name?: string;
  title?: string;
  model?: string;
  type?: string;
  extension?: boolean;
}

export interface MetaJsonModel extends AxelorEntity {
  name?: string;
  title?: string;
  modelType?: string;
}

export interface MetaJsonField extends AxelorEntity {
  name?: string;
  type?: string;
  title?: string;
  model?: string;
  targetModel?: string;
  targetJsonModel?: string;
  modelField?: string;
  jsonModel?: string;
  nameField?: boolean;
  required?: boolean;
  selection?: string;
  sequence?: number;
}

export interface MetaSelect extends AxelorEntity {
  name?: string;
  items?: MetaSelectItem[];
}

export interface MetaSelectItem extends AxelorEntity {
  title?: string;
  value?: string;
  color?: string;
  data?: string;
  order?: number;
}

export interface MetaTranslation extends AxelorEntity {
  key?: string;
  message?: string;
  language?: string;
}

export interface MetaMenu extends AxelorEntity {
  name?: string;
  title?: string;
  parent?: string;
  action?: string;
}

export interface MetaAction extends AxelorEntity {
  module?: string;
  name?: string;
  type?: string;
  priority?: number;
}

// ---------------------------------------------------------------------------
// Application entities
// ---------------------------------------------------------------------------

export interface StudioApp extends AxelorEntity {
  appStudio?: Pick<AppStudio, "id">;
  appBpm?: Pick<AppBpm, "id">;
}

export interface AppStudio extends AxelorEntity {
  enableStudioApp?: boolean;
}

export interface AppBpm extends AxelorEntity {
  useProgressDeploymentBar?: boolean;
}

export interface Template extends AxelorEntity {}

export interface Role extends AxelorEntity {
  name?: string;
}

// ---------------------------------------------------------------------------
// UI structure (not a persistent entity)
// ---------------------------------------------------------------------------

/**
 * Recursive view element structure from Axelor metadata view responses.
 * Represents panels, fields, toolbars, menubars -- any item in a form/grid view.
 */
export interface ViewElement {
  type?: string;
  name?: string;
  title?: string;
  items?: ViewElement[];
  toolbar?: ViewElement[];
  menubar?: ViewElement[];
  jsonFields?: ViewElement[];
  onClick?: string;
  readonlyIf?: string;
  hideIf?: string;
  [key: string]: unknown;
}
