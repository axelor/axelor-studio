import { vi } from "vitest";

// Shared mock variables for BPM property characterization tests.
// Each test file imports these and writes its own vi.mock() calls at module level
// (vi.mock() must be directly in the test file for Vitest hoisting to work).
export const mockGetBusinessObject = vi.fn();
export const mockIs = vi.fn((element: any, type: string) => element?.type === type);

// --- Shared helpers ---

export function createMockElement(type = "bpmn:UserTask", extensionValues: any[] = []) {
  const bo = {
    $type: type,
    name: "Test Task",
    extensionElements: extensionValues.length ? { values: extensionValues } : undefined,
  };
  mockGetBusinessObject.mockReturnValue(bo);
  return { id: "TestElement_1", type, businessObject: bo };
}

export function createEmptyElement() {
  const bo = {
    $type: "bpmn:UserTask",
    name: "Empty Task",
    extensionElements: undefined,
  };
  mockGetBusinessObject.mockReturnValue(bo);
  return { id: "EmptyElement_1", type: "bpmn:UserTask", businessObject: bo };
}

export function createMockBpmnFactory() {
  return {
    create: vi.fn((type: string, props: any) => ({ $type: type, ...props })),
  };
}
