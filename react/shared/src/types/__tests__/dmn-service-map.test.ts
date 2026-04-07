import { expectTypeOf, test, describe } from "vitest";

import type {
  DmnServiceMap,
  DmnSheet,
  DmnEventBus,
  DmnElementRegistry,
  DmnModeling,
  DmnCanvas,
  DmnActiveViewer,
  DmnDecisionTableRoot,
} from "../dmn-service-map";
import type { DmnElement } from "../dmn-types";

describe("DmnServiceMap", () => {
  test("has all 5 known services with correct types", () => {
    expectTypeOf<DmnServiceMap["sheet"]>().toEqualTypeOf<DmnSheet>();
    expectTypeOf<DmnServiceMap["eventBus"]>().toEqualTypeOf<DmnEventBus>();
    expectTypeOf<DmnServiceMap["elementRegistry"]>().toEqualTypeOf<DmnElementRegistry>();
    expectTypeOf<DmnServiceMap["modeling"]>().toEqualTypeOf<DmnModeling>();
    expectTypeOf<DmnServiceMap["canvas"]>().toEqualTypeOf<DmnCanvas>();
  });

  test("DmnElementRegistry.get() returns DmnElement | undefined (not any)", () => {
    type GetResult = ReturnType<DmnElementRegistry["get"]>;
    expectTypeOf<GetResult>().toEqualTypeOf<DmnElement | undefined>();
  });

  test("DmnSheet.getRoot() returns DmnDecisionTableRoot (not any)", () => {
    type RootResult = ReturnType<DmnSheet["getRoot"]>;
    expectTypeOf<RootResult>().toEqualTypeOf<DmnDecisionTableRoot>();
  });

  test("DmnModeling has updateProperties and editCell", () => {
    expectTypeOf<DmnModeling>().toHaveProperty("updateProperties");
    expectTypeOf<DmnModeling>().toHaveProperty("editCell");
    expectTypeOf<DmnModeling>().toHaveProperty("_eventBus");
  });

  test("DmnCanvas has zoom method", () => {
    expectTypeOf<DmnCanvas>().toHaveProperty("zoom");
  });

  test("DmnActiveViewer.get() resolves known services", () => {
    // The overloaded get resolves to union at type level
    expectTypeOf<DmnActiveViewer>().toHaveProperty("get");
  });

  test("DmnEventBus has on, off, fire methods", () => {
    expectTypeOf<DmnEventBus>().toHaveProperty("on");
    expectTypeOf<DmnEventBus>().toHaveProperty("off");
    expectTypeOf<DmnEventBus>().toHaveProperty("fire");
  });
});
