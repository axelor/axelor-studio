import type { ComponentType } from "react";
import type { DmnElement, DmnExpression } from "@studio/shared/types";
import type { DmnModeler } from "dmn-js/lib/Modeler";

// Re-export shared types for backward compat with existing panel imports
export type { DmnElement, DmnExpression, DmnModeler };

export type TranslateFn = (s: string) => string;

export interface DmnPropertyEntry {
  id: string;
  label?: string;
  description?: string;
  modelProperty?: string;
  widget?: string;
  selectOptions?: ReadonlyArray<{ name: string; value: string }>;
  disabled?: boolean;
  get?: (element?: DmnElement) => Record<string, unknown>;
  set?: (element: DmnElement, values: Record<string, unknown>) => void;
  getProperty?: (element: DmnElement) => unknown;
  setProperty?: (element: DmnElement, values: Record<string, unknown>) => void;
  validate?: (element: DmnElement, values: Record<string, string>) => Record<string, string> | undefined;
  component?: ComponentType<unknown>;
  [key: string]: unknown;
}

export interface DmnPropertyGroup {
  id: string;
  label: string;
  entries: DmnPropertyEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: ComponentType<any>;
  [key: string]: unknown;
}

export interface MetaFieldInfo {
  name?: string;
  type?: string;
  selection?: string;
  model?: string;
  jsonTarget?: string;
  targetName?: string;
  fullName?: string;
  title?: string;
  [key: string]: unknown;
}

export interface ModelOption {
  name: string;
  fullName?: string;
  title?: string;
  [key: string]: unknown;
}

export interface RangeOption {
  name: string;
  id: string;
}

export interface ComparisonOperator {
  name: string;
  id: string;
}
