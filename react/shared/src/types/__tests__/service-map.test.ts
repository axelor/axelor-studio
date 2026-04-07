import { expectTypeOf, test, describe } from "vitest";

import type {
  BpmnServiceMap,
  BpmnFactory,
  Canvas,
  ElementRegistry,
  EventBus,
  Modeling,
  Linting,
  PropertiesPanel,
  BpmnSelection,
  ElementLike,
  DiagramShape,
  DiagramRoot,
} from "../bpmn-service-map";
import type { ModdleElement } from "../moddl-types";
import type {
  CamundaExtensionMap,
  CamundaProperties,
  CamundaConnector,
  CamundaFailedJobRetryTimeCycle,
  CamundaExecutionListener,
  CamundaProcessConfiguration,
  CamundaMenus,
  CamundaViewAttributes,
} from "../camunda-extension-map";

describe("BpmnServiceMap", () => {
  test("has all 8 known services with correct types", () => {
    expectTypeOf<BpmnServiceMap["bpmnFactory"]>().toEqualTypeOf<BpmnFactory>();
    expectTypeOf<BpmnServiceMap["canvas"]>().toEqualTypeOf<Canvas>();
    expectTypeOf<BpmnServiceMap["elementRegistry"]>().toEqualTypeOf<ElementRegistry>();
    expectTypeOf<BpmnServiceMap["eventBus"]>().toEqualTypeOf<EventBus>();
    expectTypeOf<BpmnServiceMap["modeling"]>().toEqualTypeOf<Modeling>();
    expectTypeOf<BpmnServiceMap["linting"]>().toEqualTypeOf<Linting>();
    expectTypeOf<BpmnServiceMap["propertiesPanel"]>().toEqualTypeOf<PropertiesPanel>();
    expectTypeOf<BpmnServiceMap["selection"]>().toEqualTypeOf<BpmnSelection>();
  });

  test("ElementRegistry.get() returns ElementLike | undefined (not any)", () => {
    type GetResult = ReturnType<ElementRegistry["get"]>;
    expectTypeOf<GetResult>().toEqualTypeOf<ElementLike | undefined>();
  });

  test("ElementRegistry.getAll() returns ElementLike[] (not any[])", () => {
    type GetAllResult = ReturnType<ElementRegistry["getAll"]>;
    expectTypeOf<GetAllResult>().toEqualTypeOf<ElementLike[]>();
  });

  test("ElementRegistry.filter() callback receives ElementLike (not any)", () => {
    type FilterFn = Parameters<ElementRegistry["filter"]>[0];
    expectTypeOf<Parameters<FilterFn>[0]>().toEqualTypeOf<ElementLike>();
  });

  test("Canvas.getRootElement() returns DiagramRoot (not any)", () => {
    type RootResult = ReturnType<Canvas["getRootElement"]>;
    expectTypeOf<RootResult>().toEqualTypeOf<DiagramRoot>();
  });

  test("Modeling.updateProperties accepts ElementLike (not any)", () => {
    expectTypeOf<Modeling>().toHaveProperty("updateProperties");
    expectTypeOf<Modeling>().toHaveProperty("setColor");
    expectTypeOf<Modeling>().toHaveProperty("removeElements");
  });

  test("Modeling.createShape returns DiagramShape (not any)", () => {
    type CreateResult = ReturnType<Modeling["createShape"]>;
    expectTypeOf<CreateResult>().toEqualTypeOf<DiagramShape>();
  });

  test("BpmnFactory.create returns ModdleElement (not any)", () => {
    type CreateResult = ReturnType<BpmnFactory["create"]>;
    expectTypeOf<CreateResult>().toEqualTypeOf<ModdleElement>();
  });

  test("BpmnSelection.get() returns ElementLike[] (not any[])", () => {
    type SelectionResult = ReturnType<BpmnSelection["get"]>;
    expectTypeOf<SelectionResult>().toEqualTypeOf<ElementLike[]>();
  });

  test("Canvas has zoom, addMarker, removeMarker", () => {
    expectTypeOf<Canvas>().toHaveProperty("zoom");
    expectTypeOf<Canvas>().toHaveProperty("addMarker");
    expectTypeOf<Canvas>().toHaveProperty("removeMarker");
  });
});

describe("CamundaExtensionMap", () => {
  test("has all 7 known extension types", () => {
    expectTypeOf<CamundaExtensionMap["camunda:Properties"]>().toEqualTypeOf<CamundaProperties>();
    expectTypeOf<CamundaExtensionMap["camunda:Connector"]>().toEqualTypeOf<CamundaConnector>();
    expectTypeOf<
      CamundaExtensionMap["camunda:FailedJobRetryTimeCycle"]
    >().toEqualTypeOf<CamundaFailedJobRetryTimeCycle>();
    expectTypeOf<
      CamundaExtensionMap["camunda:ExecutionListener"]
    >().toEqualTypeOf<CamundaExecutionListener>();
    expectTypeOf<
      CamundaExtensionMap["camunda:ProcessConfiguration"]
    >().toEqualTypeOf<CamundaProcessConfiguration>();
    expectTypeOf<CamundaExtensionMap["camunda:Menus"]>().toEqualTypeOf<CamundaMenus>();
    expectTypeOf<
      CamundaExtensionMap["camunda:ViewAttributes"]
    >().toEqualTypeOf<CamundaViewAttributes>();
  });

  test("CamundaProperties has $type and values", () => {
    expectTypeOf<CamundaProperties>().toHaveProperty("$type");
    expectTypeOf<CamundaProperties>().toHaveProperty("values");
  });
});
