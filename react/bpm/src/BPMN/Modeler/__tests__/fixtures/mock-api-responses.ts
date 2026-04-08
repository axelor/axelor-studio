/**
 * Reusable mock API responses for BPMN Modeler characterization tests.
 *
 * These mocks simulate the Axelor JSON-RPC API responses that the
 * BpmnModeler component relies on for save, deploy, and fetch operations.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { vi } from "vitest";
import type { ModdleElement, AxelorResponse, AxelorActionResponse, WkfModel, TypedBpmnModeler } from "@studio/shared/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the sample BPMN XML fixture.
 */
function loadSampleBpmn(): string {
  return readFileSync(resolve(__dirname, "./sample-bpmn.xml"), "utf-8");
}

/**
 * Mock WkfModel record as returned by the Axelor REST API.
 * Matches the shape used in BpmnModeler.jsx: wkf state with diagramXml,
 * wkfProcessList, oldNodes, etc.
 */
export const mockWkfModel = {
  id: 1,
  version: 0,
  name: "Test Process",
  code: "test-process",
  diagramXml: loadSampleBpmn(),
  isActive: true,
  statusSelect: 1,
  oldNodes: "[]",
  wkfProcessList: [
    {
      id: 1,
      version: 0,
      name: "Process_1",
      processId: "Process_1",
      description: null as string | null,
      wkfProcessConfigList: [] as unknown[],
      wkfTaskConfigList: [] as unknown[],
    },
  ],
};

/**
 * Simulates a successful save response from Service.add().
 * The version is incremented to reflect a persisted save.
 */
export const mockSaveResponse: AxelorResponse<WkfModel> = {
  status: 0,
  data: [
    {
      ...mockWkfModel,
      version: 1,
    },
  ],
};

/**
 * Simulates a successful deploy action response from Service.action().
 * The deploy action returns reload: true and updated values with statusSelect: 2.
 */
export const mockDeployResponse: AxelorActionResponse = {
  status: 0,
  data: [
    {
      reload: true,
      values: {
        ...mockWkfModel,
        statusSelect: 2,
      },
    },
  ],
};

/**
 * Wraps records in the standard Axelor JSON-RPC response format.
 * Used by Service.search(), Service.fetchId(), etc.
 */
export function mockSearchResponse<T = Record<string, unknown>>(records: T[]): AxelorResponse<T> {
  return {
    status: 0,
    data: records,
  };
}

/**
 * Creates a typed mock BpmnModeler instance for tests.
 * Uses `as unknown as BpmnModeler` pattern per D-09 for partial mocks.
 */
export function createMockModeler(
  overrides: Partial<Record<string, unknown>> = {},
): TypedBpmnModeler {
  return {
    get: vi.fn(),
    saveXML: vi.fn().mockResolvedValue({ xml: "<xml/>" }),
    importXML: vi.fn().mockResolvedValue({}),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    ...overrides,
  } as unknown as TypedBpmnModeler;
}

/**
 * Creates a typed mock ModdleElement for tests.
 * Uses `as unknown as ModdleElement` pattern per D-09 for partial mocks.
 */
export function createMockElement(
  overrides: Partial<ModdleElement> = {},
): ModdleElement {
  return {
    $type: "bpmn:Task",
    $attrs: {},
    get: vi.fn((key: string) => (overrides as Record<string, unknown>)[key]),
    ...overrides,
  } as unknown as ModdleElement;
}
