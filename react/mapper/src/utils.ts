export const excludedFields = ["createdBy", "createdOn", "updatedBy", "updatedOn", "version", "id"];

export const VALUE_FROM = {
  CONTEXT: "context",
  SELF: "self",
  NONE: "none",
  SOURCE: "source",
  PARENT: "parent",
  EXPRESSION: "expression",
  QUERY: "query",
  PROCESS: "process",
  DMN: "dmn",
} as const;

export type ValueMode = (typeof VALUE_FROM)[keyof typeof VALUE_FROM];

export const DATE_FORMAT: Record<string, string> = {
  date: "DD/MM/YYYY",
  time: "HH:mm:ss",
  datetime: "DD/MM/YYYY HH:mm",
};

export function dashToUnderScore(str: string | undefined | null): string {
  return str ? str.replace("json-", "").replaceAll("-", "_").toLowerCase() : "";
}

export function lowerCaseFirstLetter(str: string | undefined | null): string {
  return str ? str.charAt(0).toLowerCase() + str.slice(1) : "";
}

export { translate } from "@studio/shared/i18n";

export interface MetaField {
  name: string;
  title?: string;
  autoTitle?: string;
  type: string;
  required?: boolean;
  target?: string;
  targetModel?: string;
  targetName?: string;
  targetJsonModel?: { name: string } | string;
  jsonTarget?: string;
  fullName?: string;
  modelType?: string;
  model?: string;
  domain?: string;
  jsonModel?: { name: string } | string;
  selectionList?: SelectionItem[];
  defaultValue?: string;
  subFieldName?: MetaField;
  [key: string]: unknown;
}

export interface SelectionItem {
  title: string;
  value: unknown;
  data?: { value: unknown };
}

export interface BuilderField extends MetaField {
  key?: number;
  condition?: string | null;
  conditionMeta?: unknown;
  searchField?: { name: string; title?: string } | null;
  dmn?: DmnValue | null;
  processId?: { name: string } | null;
  value: BuilderFieldValue;
  contextModel?: { target: string };
}

export interface BuilderFieldValue {
  from?: ValueMode | string;
  selected?: { value: unknown; targetName?: string } | null;
  query?: unknown;
  subFields?: MetaField[];
  fields?: BuilderField[];
  [key: string]: unknown;
}

export interface DmnValue {
  dmnNodeId?: string;
  dmnNodeNameId?: string;
  name?: string;
  resultVariable?: string;
  outputDmnFieldList?: Array<{ name: string }>;
  [key: string]: unknown;
}

export interface ModelRecord {
  name?: string;
  fullName?: string;
  modelType?: string;
  target?: string;
  title?: string;
  [key: string]: unknown;
}

