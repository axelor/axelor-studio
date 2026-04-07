// Ambient declarations for @bpmn-io/dmn-migrate

declare module '@bpmn-io/dmn-migrate' {
  export function migrateDiagram(xml: string): Promise<string>;
}
