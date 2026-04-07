/**
 * Local type definitions for the BPMN properties panel layer.
 *
 * These types describe the runtime shapes used by entry-provider functions
 * and React property-panel components. They complement the shared types
 * (ModdleElement, BpmnElement, PropertyEntry) with BPM-specific interfaces.
 */
import type {
  ModdleElement,
  BpmnElement,
  BpmnFactory,
  TypedBpmnModeler,
} from "@studio/shared/types";

// ---------- Component prop types ----------

/** Runtime bpmn-moddle instance with element creation capability. */
export interface BpmnModdleLike {
  create: (type: string, attrs: Record<string, unknown>) => ModdleElement;
  [key: string]: unknown;
}

/**
 * Common props received by all CustomImplementation React components.
 * `element` is typed as `BpmnElement | ModdleElement` because it may be either
 * a diagram shape (BpmnElement) or a moddle element (ModdleElement) depending
 * on the caller context.
 */
export interface PropertiesPanelComponentProps {
  element?: BpmnElement | ModdleElement;
  index?: number;
  label?: string;
  bpmnFactory?: BpmnFactory;
  bpmnModeler?: TypedBpmnModeler;
  bpmnModdle?: BpmnModdleLike;
  id?: string;
  updateCommentsCount?: (increment: boolean) => void;
  [key: string]: unknown;
}


