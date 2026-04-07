import type { DmnElement, MetaFieldInfo, RangeOption, ComparisonOperator } from "../types";

export interface CommonEditorProps {
  updateDRDCell: (output: Record<string, unknown>, row: Record<string, unknown>, value?: string) => void;
  ruleValue: Record<string, unknown> | undefined;
  rule: Record<string, unknown>;
  defaultType: Record<string, unknown> | null;
  setValueType: (type: string, val?: unknown) => void;
  element: DmnElement;
  value: string | undefined;
  isOutput: boolean;
}

export interface StringTypeEditorProps extends CommonEditorProps {
  metaField: Record<string, unknown> | null;
  relationalField: Record<string, unknown> | null;
  valueFrom: string | undefined;
  nameCol: string;
}

export interface BooleanTypeEditorProps {
  updateDRDCell: CommonEditorProps["updateDRDCell"];
  ruleValue: CommonEditorProps["ruleValue"];
  rule: CommonEditorProps["rule"];
  defaultType: CommonEditorProps["defaultType"];
}

export interface DateTypeEditorProps extends CommonEditorProps {
  type: string;
  dates: (string | null)[] | null;
}

export interface NumberTypeEditorProps extends Omit<CommonEditorProps, "value"> {
  type: string;
  comparisonOperator: ComparisonOperator;
  rangeStartValue: number | string;
  rangeEndValue: number | string;
  rangeEndType: RangeOption;
  rangeStartType: RangeOption;
  numberValue: number | string;
}

export interface SelectionTypeEditorProps {
  updateDRDCell: CommonEditorProps["updateDRDCell"];
  ruleValue: CommonEditorProps["ruleValue"];
  rule: CommonEditorProps["rule"];
  setValueType: CommonEditorProps["setValueType"];
  metaField: MetaFieldInfo | null;
  value: string | undefined;
  metaFieldName: string | null;
  nameField: string | null;
}

export interface RelationalTypeEditorProps {
  updateDRDCell: CommonEditorProps["updateDRDCell"];
  ruleValue: CommonEditorProps["ruleValue"];
  rule: CommonEditorProps["rule"];
  defaultType: CommonEditorProps["defaultType"];
  setValueType: CommonEditorProps["setValueType"];
  isOutput: boolean;
  fetchData: () => Promise<unknown[]>;
  metaFieldName: string | null;
  nameField: string | null;
  metaField: MetaFieldInfo | null;
}

export interface DefaultTypeEditorProps extends CommonEditorProps {}
