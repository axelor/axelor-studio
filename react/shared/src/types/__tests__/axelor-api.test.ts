import { expectTypeOf, test, describe } from "vitest";

import type {
  AxelorResponse,
  ActionData,
  AxelorActionResponse,
  AxelorViewResponse,
} from "../axelor-api";
import { isAxelorError } from "../axelor-api";

describe("AxelorResponse", () => {
  test("default generic produces Record<string, unknown>[] data", () => {
    expectTypeOf<AxelorResponse>().toHaveProperty("data");
    expectTypeOf<AxelorResponse["data"]>().toEqualTypeOf<Record<string, unknown>[]>();
  });

  test("generic parameter types data array elements", () => {
    type WkfModel = { name: string; id: number };
    expectTypeOf<AxelorResponse<WkfModel>["data"]>().toEqualTypeOf<WkfModel[]>();
  });

  test("has required status and optional offset/total/errors", () => {
    expectTypeOf<AxelorResponse>().toHaveProperty("status");
    expectTypeOf<AxelorResponse>().toHaveProperty("offset");
    expectTypeOf<AxelorResponse>().toHaveProperty("total");
    expectTypeOf<AxelorResponse>().toHaveProperty("errors");
  });
});

describe("AxelorActionResponse", () => {
  test("data is ActionData[]", () => {
    expectTypeOf<AxelorActionResponse["data"]>().toEqualTypeOf<ActionData[]>();
  });

  test("ActionData has view, values, attrs, reload, signal, error", () => {
    expectTypeOf<ActionData>().toHaveProperty("view");
    expectTypeOf<ActionData>().toHaveProperty("values");
    expectTypeOf<ActionData>().toHaveProperty("attrs");
    expectTypeOf<ActionData>().toHaveProperty("reload");
    expectTypeOf<ActionData>().toHaveProperty("signal");
    expectTypeOf<ActionData>().toHaveProperty("error");
  });
});

describe("AxelorViewResponse", () => {
  test("data is object with view, fields, jsonFields, jsonAttrs", () => {
    expectTypeOf<AxelorViewResponse["data"]>().toHaveProperty("view");
    expectTypeOf<AxelorViewResponse["data"]>().toHaveProperty("fields");
    expectTypeOf<AxelorViewResponse["data"]>().toHaveProperty("jsonFields");
    expectTypeOf<AxelorViewResponse["data"]>().toHaveProperty("jsonAttrs");
  });
});

describe("isAxelorError", () => {
  test("accepts all three response types", () => {
    // Parameter is a union of all three response types
    type Param = Parameters<typeof isAxelorError>[0];
    expectTypeOf<AxelorResponse>().toMatchTypeOf<Param>();
    expectTypeOf<AxelorActionResponse>().toMatchTypeOf<Param>();
    expectTypeOf<AxelorViewResponse>().toMatchTypeOf<Param>();
  });

  test("returns boolean", () => {
    expectTypeOf(isAxelorError).returns.toBeBoolean();
  });
});
