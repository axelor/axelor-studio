import type { ModdleElement } from "./moddl-types";

export interface PropertyEntry {
  id: string;
  label?: string;
  description?: string;
  modelProperty?: string;
  disabled?: boolean;
  get?: (element: ModdleElement) => Record<string, unknown>;
  set?: (element: ModdleElement, values: Record<string, unknown>) => void;
  getProperty?: (element: ModdleElement) => unknown;
  setProperty?: (element: ModdleElement, values: Record<string, unknown>) => void;
}
