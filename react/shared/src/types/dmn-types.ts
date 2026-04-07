// Structural DMN element types -- SSOT for all dmn-js consumers
// Migrated from react/dmn/src/properties/types.ts (Phase 35, D-10)

export interface DmnElement {
  labelTarget?: DmnElement;
  id?: string;
  type?: string;
  businessObject?: Record<string, unknown>;
  incoming?: unknown[];
  outgoing?: unknown[];
  inputExpression?: DmnExpression;
  $attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DmnExpression {
  text?: string;
  typeRef?: string;
  expressionLanguage?: string;
  $attrs?: Record<string, unknown>;
  [key: string]: unknown;
}
