/**
 * useBpmnViewer - Custom hook centralizing all bpmn-js v18 API interactions.
 *
 * bpmn-js v8 -> v18 Migration (Phase 12-04, completed)
 * =====================================================
 * All 24 migration markers resolved. Key changes applied:
 *
 * - elementRegistry._elements replaced with elementRegistry.getAll() (public API)
 * - getBusinessObject import path confirmed stable (bpmn-js/lib/util/ModelUtil)
 * - BpmnModeler kept over NavigatedViewer: readOnly module + modeling.updateProperties
 *   require Modeler services (contextPad, dragging, directEditing, modeling, palette, etc.)
 * - readOnly module $inject deps verified present in bpmn-js 18 / diagram-js 14
 *   (same module works in bpm app with bpmn-js 18)
 * - All other APIs (importXML, canvas.zoom, filter, getGraphics, get, on/off, destroy)
 *   confirmed stable across v8-v18
 */

import { useRef, useEffect, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import type { BpmnElementClickEvent } from "bpmn-js/lib/Modeler";
import type { BpmnElement } from "@studio/shared/types";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import readOnlyModule from "../custom/readonly";
import { getInfo, getTranslations } from "../services/api";

interface BpmnViewerApi {
  importXML(xml: string): Promise<{ warnings: string[] }>;
  get(name: "canvas"): { zoom(mode: string, center: string): void };
  get(name: "elementRegistry"): {
    getAll(): BpmnElement[];
    filter(fn: (el: BpmnElement) => boolean): BpmnElement[];
    get(id: string): unknown;
    getGraphics(id: string): SVGElement | null;
  };
  get(name: "modeling"): {
    updateProperties(shape: unknown, props: Record<string, unknown>): void;
  };
  get(name: "readOnly"): { readOnly(val: boolean): void };
  on(event: string, callback: (event: BpmnElementClickEvent) => void): void;
  off(event: string, callback: (event: BpmnElementClickEvent) => void): void;
  destroy(): void;
}

interface UseBpmnViewerOptions {
  containerId: string;
  diagramXml: string | null;
  additionalModules?: Record<string, unknown>[];
  readOnly?: boolean;
  enabled?: boolean;
  selectedParticipants?: string[];
  onElementClick?: ((event: BpmnElementClickEvent) => void) | null;
}

interface UseBpmnViewerReturn {
  viewerRef: React.MutableRefObject<BpmnViewerApi | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  participants: BpmnElement[];
  isLoaded: boolean;
}

interface AppInfo {
  user?: { lang?: string };
}

interface TranslationRecord {
  language: string;
  message: string;
}

// Private helper: cached info singleton (moved from utils.tsx)
const info = (() => {
  let infoPromise: Promise<AppInfo> | null = null;
  return async (): Promise<AppInfo> => {
    if (!infoPromise) {
      infoPromise = getInfo() as Promise<AppInfo>;
    }
    return infoPromise;
  };
})();

// Private: moved from utils.tsx
function getNameProperty(element: BpmnElement): string {
  return element?.type === "bpmn:TextAnnotation"
    ? "text"
    : element?.type === "bpmn:Group"
      ? "categoryValue"
      : "name";
}

// Private: moved from utils.tsx
function getBool(val: unknown): boolean {
  if (!val || !["false", "true", true, false].includes(val as string | boolean)) return false;
  return !!JSON.parse(String(val as string | boolean).toLowerCase());
}

// Private: moved from utils.tsx
async function updateTranslationsInternal(
  element: BpmnElement,
  bpmnModeler: BpmnViewerApi,
): Promise<void> {
  if (!element) return;
  const bo = getBusinessObject(element) as Record<string, unknown> | undefined;
  if (!bo) return;
  const attrs = bo.$attrs as Record<string, unknown> | undefined;
  if (!getBool(attrs?.["camunda:isTranslations"])) return;
  if (!attrs?.["camunda:key"]) return;
  const translations = (await getTranslations(attrs["camunda:key"] as string)) as
    | TranslationRecord[]
    | undefined;
  if (!translations || translations.length <= 0) return;
  const modelProperty = getNameProperty(element);
  const userInfo = await info();
  const language = userInfo?.user?.lang;
  if (!language) return;
  const selectedTranslation = translations.find((t) => t.language === language);
  const diagramValue = selectedTranslation?.message || (attrs["camunda:key"] as string);
  if (!diagramValue) return;
  const elementRegistry = bpmnModeler.get("elementRegistry");
  const modeling = bpmnModeler.get("modeling");
  const shape = elementRegistry.get(element.id);
  modeling.updateProperties(shape, {
    [modelProperty]: diagramValue,
  });
}

export function useBpmnViewer({
  containerId,
  diagramXml,
  additionalModules = [],
  readOnly = true,
  enabled = true,
  selectedParticipants = [],
  onElementClick = null,
}: UseBpmnViewerOptions): UseBpmnViewerReturn {
  const viewerRef = useRef<BpmnViewerApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [participants, setParticipants] = useState<BpmnElement[]>([]);

  // Effect 1: Viewer lifecycle (create / import / translate / destroy)
  // Deps: [containerId, diagramXml, enabled] -- NOT including selectedParticipants
  // This FIXES the bug where participant changes recreated the entire viewer.
  useEffect(() => {
    if (!diagramXml || !containerId || !enabled) return;

    const modules = [readOnlyModule, ...additionalModules];

    const viewer = new BpmnModeler({
      container: containerId,
      additionalModules: modules,
    }) as unknown as BpmnViewerApi; // safety: bpmn-js viewer instance lacks typed API interface

    viewerRef.current = viewer;

    void (async () => {
      try {
        await viewer.importXML(diagramXml);
        const canvas = viewer.get("canvas");
        canvas.zoom("fit-viewport", "auto");

        if (readOnly) {
          const readOnlyService = viewer.get("readOnly");
          readOnlyService.readOnly(true);
        }

        // Apply translations to all elements using v18 public API
        const elementRegistry = viewer.get("elementRegistry");
        const allElements = elementRegistry.getAll();
        for (const element of allElements) {
          await updateTranslationsInternal(element, viewer);
        }

        // Extract participants for consumers
        const allParticipants = elementRegistry.filter(
          (element: BpmnElement) => element.type === "bpmn:Participant",
        );
        setParticipants(allParticipants);
        setIsLoaded(true);
      } catch (_e) {
        // Import failed -- silently handle (matches original behavior)
      }
    })();

    // Register element.click handler if provided
    if (onElementClick) {
      viewer.on("element.click", onElementClick);
    }

    return () => {
      if (onElementClick) {
        viewer.off("element.click", onElementClick);
      }
      viewer.destroy();
      viewerRef.current = null;
      setIsLoaded(false);
      setParticipants([]);
    };
  }, [containerId, diagramXml, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Participant highlighting (separate from viewer lifecycle)
  // Updates SVG styles without recreating the viewer when selection changes.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isLoaded) return;

    const elementRegistry = viewer.get("elementRegistry");
    const allParticipants = elementRegistry.filter(
      (element: BpmnElement) => element.type === "bpmn:Participant",
    );

    allParticipants.forEach((element: BpmnElement) => {
      const isSelected = selectedParticipants?.includes(element.id);
      const outgoingGfx = elementRegistry.getGraphics(element.id);
      const visual = outgoingGfx && outgoingGfx.querySelector(".djs-visual");
      const rec = visual && visual.childNodes && (visual.childNodes[0] as SVGElement | undefined);
      if (rec && rec.style) {
        if (isSelected) {
          rec.style.strokeWidth = "5px";
          rec.style.stroke = "#006400";
        } else {
          rec.style.strokeWidth = "2px";
          rec.style.stroke = "rgb(200, 200, 200)";
        }
      }
    });
  }, [selectedParticipants, isLoaded]);

  // Effect 3: ResizeObserver for container fit-viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const canvas = viewerRef.current?.get("canvas");
      canvas?.zoom("fit-viewport", "auto");
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return { viewerRef, containerRef, participants, isLoaded };
}
