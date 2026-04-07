/**
 * Typed response envelopes for the Axelor REST API.
 * Three shapes matching the natural API split:
 * - AxelorResponse<T>:      CRUD operations (search, fetchRecord, fetchId, add, delete)
 * - AxelorActionResponse:    action() calls
 * - AxelorViewResponse:      view() and fields() calls
 */

/** CRUD response envelope. T defaults to Record<string, unknown> for backward compatibility with untyped consumers. */
export interface AxelorResponse<T = Record<string, unknown>> {
  status: number;
  offset?: number;
  total?: number;
  data: T[];
  errors?: Record<string, string>;
  [key: string]: unknown;
}

/** Action data item -- heterogeneous fields from action execution results. */
export interface ActionData {
  view?: Record<string, unknown>;
  values?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  reload?: boolean;
  signal?: string;
  error?: { message?: string };
  [key: string]: unknown;
}

/** Action response envelope. */
export interface AxelorActionResponse {
  status: number;
  data: ActionData[];
  errors?: Record<string, string>;
  [key: string]: unknown;
}

/** View/fields metadata response envelope. data is an object, not an array. */
export interface AxelorViewResponse {
  status: number;
  data: {
    view?: Record<string, unknown>;
    fields?: Array<Record<string, unknown>>;
    jsonFields?: Record<string, Record<string, unknown>>;
    jsonAttrs?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  errors?: Record<string, string>;
}

/** Type guard for error responses (status === -1). */
export function isAxelorError(
  res: AxelorResponse | AxelorActionResponse | AxelorViewResponse,
): boolean {
  return res.status === -1;
}
