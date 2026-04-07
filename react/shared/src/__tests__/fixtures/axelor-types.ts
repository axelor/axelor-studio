/**
 * Shared test fixtures: factory functions for Axelor domain types.
 * Uses Partial<T> overrides pattern (D-06) for flexible test data creation.
 *
 * @module test-fixtures/axelor-types
 */
import type { MetaField, WkfModel, AxelorResponse, MetaModel, MetaJsonModel, MetaView } from "../../types";

export function makeMetaField(overrides: Partial<MetaField> = {}): MetaField {
  return {
    id: 1,
    name: "testField",
    type: "string",
    label: "Test Field",
    targetName: undefined,
    selectionList: undefined,
    ...overrides,
  };
}

export function makeAxelorResponse<T = Record<string, unknown>>(
  overrides: Partial<AxelorResponse<T>> = {},
): AxelorResponse<T> {
  return {
    status: 0,
    data: [] as unknown as T[],
    ...overrides,
  };
}

export function makeWkfModel(overrides: Partial<WkfModel> = {}): WkfModel {
  return {
    id: 1,
    name: "Test Process",
    statusSelect: 1,
    diagramXml: "<bpmn />",
    ...overrides,
  };
}

export function makeMetaModel(overrides: Partial<MetaModel> = {}): MetaModel {
  return {
    id: 1,
    name: "TestModel",
    fullName: "com.axelor.test.TestModel",
    ...overrides,
  };
}

export function makeMetaJsonModel(overrides: Partial<MetaJsonModel> = {}): MetaJsonModel {
  return {
    id: 1,
    name: "TestJsonModel",
    title: "Test Json Model",
    ...overrides,
  };
}

export function makeMetaView(overrides: Partial<MetaView> = {}): MetaView {
  return {
    id: 1,
    name: "test-form",
    title: "Test Form",
    model: "com.axelor.test.TestModel",
    type: "form",
    ...overrides,
  };
}
