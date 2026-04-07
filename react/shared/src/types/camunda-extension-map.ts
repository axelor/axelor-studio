// Typed extension map for getExtension() -- covers 7 distinct camunda extension types
// across 19 consumer files

export interface CamundaExtensionMap {
  "camunda:Properties": CamundaProperties;
  "camunda:Connector": CamundaConnector;
  "camunda:FailedJobRetryTimeCycle": CamundaFailedJobRetryTimeCycle;
  "camunda:ExecutionListener": CamundaExecutionListener;
  "camunda:ProcessConfiguration": CamundaProcessConfiguration;
  "camunda:Menus": CamundaMenus;
  "camunda:ViewAttributes": CamundaViewAttributes;
}

export interface CamundaProperties {
  $type: "camunda:Properties";
  values: CamundaProperty[];
}

export interface CamundaProperty {
  $type: "camunda:Property";
  name: string;
  value: string;
}

export interface CamundaConnector {
  $type: "camunda:Connector";
  connectorId?: string;
  inputOutput?: CamundaInputOutput;
}

export interface CamundaInputOutput {
  $type: "camunda:InputOutput";
  inputParameters: CamundaParameter[];
  outputParameters: CamundaParameter[];
}

export interface CamundaParameter {
  $type: "camunda:InputParameter" | "camunda:OutputParameter";
  name: string;
  value?: string;
  definition?: any;
}

export interface CamundaFailedJobRetryTimeCycle {
  $type: "camunda:FailedJobRetryTimeCycle";
  body: string;
}

export interface CamundaExecutionListener {
  $type: "camunda:ExecutionListener";
  event: string;
  class?: string;
  expression?: string;
  delegateExpression?: string;
  script?: any;
}

export interface CamundaProcessConfiguration {
  $type: "camunda:ProcessConfiguration";
  metaModel?: string;
  metaJsonModel?: string;
  isStartModel?: boolean;
  isDirectCreation?: boolean;
  isCustom?: boolean;
  processPath?: string;
  pathCondition?: string;
}

export interface CamundaMenus {
  $type: "camunda:Menus";
  menuItems: CamundaMenuItem[];
}

export interface CamundaMenuItem {
  $type: "camunda:MenuItem";
  menuName?: string;
  menuParent?: string;
  position?: string;
  positionAfter?: string;
  positionBefore?: string;
  permanent?: boolean;
  tagCount?: boolean;
  userDefaultMenu?: boolean;
}

export interface CamundaViewAttributes {
  $type: "camunda:ViewAttributes";
  items: CamundaViewAttribute[];
}

export interface CamundaViewAttribute {
  $type: "camunda:ViewAttribute";
  name: string;
  value: string;
}

// Overloaded typed getter function
export function getCamundaExtension<K extends keyof CamundaExtensionMap>(
  extensionElements: { values?: any[] } | undefined,
  type: K,
): CamundaExtensionMap[K] | undefined;
export function getCamundaExtension(
  extensionElements: { values?: any[] } | undefined,
  type: string,
): unknown;
export function getCamundaExtension(
  extensionElements: { values?: any[] } | undefined,
  type: string,
): CamundaExtensionMap[keyof CamundaExtensionMap] | unknown | undefined {
  if (!extensionElements || !extensionElements.values) return undefined;
  return extensionElements.values.find((e: any) => e.$type === type);
}
