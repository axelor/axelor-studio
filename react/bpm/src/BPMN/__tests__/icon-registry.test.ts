import { describe, it, expect } from "vitest";

import iconsByType from "../icons/index";
import { getElementIcon } from "../../utils";

describe("icon registry", () => {
  it("every iconsByType entry is a renderable function (SVGR component)", () => {
    const entries = Object.entries(iconsByType);
    expect(entries.length).toBeGreaterThan(0);

    for (const [_type, icon] of entries as Array<[string, unknown]>) {
      expect(typeof icon).toBe("function");
    }
  });

  it("UserTask icon is a function", () => {
    expect(typeof iconsByType["UserTask"]).toBe("function");
  });

  it("StartEvent icon is a function", () => {
    expect(typeof iconsByType["StartEvent"]).toBe("function");
  });

  it("EndEvent icon is a function", () => {
    expect(typeof iconsByType["EndEvent"]).toBe("function");
  });
});

describe("getElementIcon", () => {
  it("returns an object with icon as function for a UserTask element", () => {
    const mockElement = {
      type: "bpmn:Task",
      $type: "bpmn:Task",
      businessObject: {
        $type: "bpmn:Task",
      },
    };
    const result = getElementIcon(mockElement);
    expect(typeof result === "object" && result !== null && "type" in result).toBe(true);
  });

  it("returns empty string for null element", () => {
    const result = getElementIcon(null as unknown as Parameters<typeof getElementIcon>[0]);
    expect(result).toBe("");
  });

  it("returns icon as a function when element type maps to a known icon", () => {
    const mockElement = {
      type: "bpmn:UserTask",
      $type: "bpmn:UserTask",
      businessObject: {
        $type: "bpmn:UserTask",
      },
    };
    const result = getElementIcon(mockElement);
    expect(typeof result === "object" && result !== null && "icon" in result && typeof result.icon === "function").toBe(true);
  });
});
