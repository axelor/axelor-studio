// Ambient declarations for dmn-js@17.7.0
// Enriched Phase 35: typed getActiveViewer(), _viewers, service get() overloads

declare module 'dmn-js/lib/Modeler' {
  /**
   * Sub-viewer interface returned by getActiveViewer().
   * Structural shape compatible with DmnActiveViewer from @studio/shared/types.
   * Each sub-viewer (drd, decision-table, literal-expression) implements this.
   */
  interface DmnSubViewer {
    get(name: "sheet"): import("@studio/shared/types").DmnSheet;
    get(name: "eventBus"): import("@studio/shared/types").DmnEventBus;
    get(name: "elementRegistry"): import("@studio/shared/types").DmnElementRegistry;
    get(name: "modeling"): import("@studio/shared/types").DmnModeling;
    get(name: "canvas"): import("@studio/shared/types").DmnCanvas;
    get(name: string): unknown;
  }

  export interface DmnModeler {
    importXML(xml: string): Promise<{ warnings: string[] }>;
    saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
    /** @deprecated Callback-style overload kept for legacy code */
    saveXML(options: { format?: boolean }, callback: (err: Error | null, xml: string) => void): void;
    getActiveViewer(): DmnSubViewer;
    getActiveView(): { type: string; element: any; id?: string } | null;
    getViews(): Array<{ type: string; element: any }>;
    getDefinitions(): Record<string, any> | undefined;
    open(view: { type: string; element: any }): Promise<void>;
    get(name: string): any;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    destroy(): void;
    attachTo(parentNode: HTMLElement): void;
    detach(): void;
    /** @internal Private API -- sub-viewer access (per D-09) */
    _viewers?: Record<string, DmnSubViewer | undefined>;
  }
  const Modeler: { new(options?: Record<string, any>): DmnModeler };
  export default Modeler;
}
