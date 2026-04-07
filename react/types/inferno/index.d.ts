// Ambient declarations for inferno (minimal -- vendored boundary)

declare module 'inferno' {
  export function createVNode(flags: number, type: any, className?: string | null, children?: any, childFlags?: number, props?: any, key?: any, ref?: any): any;
  export function render(input: any, parentDOM: Element | null): void;
  export const Component: any;
}
