export interface ModdleElement {
  $type: string;
  $attrs: Record<string, unknown>;
  $parent?: ModdleElement;
  id?: string;
  name?: string;
  extensionElements?: {
    $type: "bpmn:ExtensionElements";
    values: ModdleElement[];
  };

  /**
   * Moddle property accessor — the ONLY reliable way to read properties from
   * BPMN moddle elements. Direct property access (bo.extensionElements) may
   * work in some contexts but fails for namespace-prefixed properties
   * (camunda:class, camunda:expression) and freshly-loaded business objects.
   *
   * Always prefer bo.get('extensionElements') over bo.extensionElements
   * in utility functions.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): any;

  [key: string]: unknown; // moddle is inherently dynamic
}

export interface BpmnElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent?: BpmnElement;
  children?: BpmnElement[];
  businessObject: ModdleElement;
}
