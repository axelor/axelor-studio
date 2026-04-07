// Ambient declarations for dmn-js-shared

declare module 'dmn-js-shared/lib/components/ContentEditable' {
  const ContentEditable: any;
  export default ContentEditable;
}

declare module 'dmn-js-shared/lib/components/mixins' {
  const mixins: any;
  export default mixins;
}

declare module 'dmn-js-shared/lib/features/debounce-input' {
  const debounceInput: any;
  export default debounceInput;
}

declare module 'dmn-js-shared/lib/features/expression-languages' {
  const expressionLanguages: any;
  export default expressionLanguages;
}

declare module 'dmn-js-shared/lib/util/ModelUtil' {
  export function is(element: any, type: string): boolean;
  export function isAny(element: any, types: string[]): boolean;
  export function getBusinessObject(element: any): any;
  export function getName(element: any): string;
}

declare module 'dmn-js-shared/lib/util/ModelUtil.js' {
  export { is, getBusinessObject, getName } from 'dmn-js-shared/lib/util/ModelUtil';
}
