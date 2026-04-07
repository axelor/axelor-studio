// Ambient declarations for dmn-js-properties-panel

declare module 'dmn-js-properties-panel' {
  export const DmnPropertiesPanelModule: any;
  export const DmnPropertiesProviderModule: any;
}

declare module 'dmn-js-properties-panel/lib/provider/camunda/parts/HistoryTimeToLiveProps' {
  function HistoryTimeToLiveProps(group: any, element: any, translate: any): void;
  export default HistoryTimeToLiveProps;
}

declare module 'dmn-js-properties-panel/lib/provider/camunda/parts/VersionTagProps' {
  function VersionTagProps(group: any, element: any, translate: any): void;
  export default VersionTagProps;
}

declare module 'dmn-js-properties-panel/lib/provider/dmn/parts/IdProps' {
  function IdProps(group: any, element: any, translate: any, options?: any): void;
  export default IdProps;
}

declare module 'dmn-js-properties-panel/lib/provider/dmn/parts/NameProps' {
  function NameProps(group: any, element: any, translate: any): void;
  export default NameProps;
}
