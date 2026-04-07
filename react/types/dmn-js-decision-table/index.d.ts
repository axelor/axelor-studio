// Ambient declarations for dmn-js-decision-table

declare module 'dmn-js-decision-table/lib/features/add-input-output' {
  const addInputOutput: any;
  export default addInputOutput;
}

declare module 'dmn-js-decision-table/lib/features/allowed-values' {
  const allowedValues: any;
  export default allowedValues;
}

declare module 'dmn-js-decision-table/lib/features/cell-selection' {
  const cellSelection: any;
  export default cellSelection;
}

declare module 'dmn-js-decision-table/lib/features/cell-selection/CellSelectionUtil' {
  export function selectCell(cell: any): void;
}

declare module 'dmn-js-decision-table/lib/features/keyboard' {
  const keyboard: any;
  export default keyboard;
}

declare module 'dmn-js-decision-table/lib/features/simple-boolean-edit/Utils' {
  export function parseString(value: string): any;
}

declare module 'dmn-js-decision-table/lib/features/simple-date-edit/Utils' {
  export function parseString(value: string): { date?: string; type?: string } | null;
  export function getDateString(type: string, values: (string | undefined)[]): string;
}

declare module 'dmn-js-decision-table/lib/features/simple-number-edit/Utils' {
  export function parseString(value: string): any;
  export function getNumberString(number: any): string;
  export function getComparisonString(operator: string, value: number | string): string;
  export function getRangeString(start: number | string, end: number | string, startType?: string, endType?: string): string;
}

declare module 'dmn-js-decision-table/lib/features/simple-string-edit/Utils.js' {
  export function parseString(value: string): any;
}

declare module 'dmn-js-decision-table/lib/features/type-ref' {
  const typeRef: any;
  export default typeRef;
}
