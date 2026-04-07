import { expectTypeOf, test } from "vitest";
import type { TypedBpmnModeler } from "@studio/shared/types";
import { useModeler } from "../hooks/useModeler";

test("useModeler returns TypedBpmnModeler | null", () => {
  expectTypeOf(useModeler).returns.toEqualTypeOf<TypedBpmnModeler | null>();
});
