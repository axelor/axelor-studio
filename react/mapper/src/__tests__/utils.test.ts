/**
 * Tests for mapper/utils pure functions.
 *
 * Covers dashToUnderScore, lowerCaseFirstLetter, and constant exports.
 */

import { describe, it, expect } from "vitest";

import {
  dashToUnderScore,
  lowerCaseFirstLetter,
  VALUE_FROM,
  DATE_FORMAT,
  excludedFields,
} from "../utils";

describe("mapper/utils", () => {
  // --- dashToUnderScore ---

  it("dashToUnderScore: converts dashed names removing json- prefix", () => {
    expect(dashToUnderScore("json-many-to-one")).toBe("many_to_one");
    expect(dashToUnderScore("one-to-many")).toBe("one_to_many");
  });

  it("dashToUnderScore: returns empty string for null/undefined", () => {
    expect(dashToUnderScore(null)).toBe("");
    expect(dashToUnderScore(undefined)).toBe("");
  });

  // --- lowerCaseFirstLetter ---

  it("lowerCaseFirstLetter: lowercases first character", () => {
    expect(lowerCaseFirstLetter("SaleOrder")).toBe("saleOrder");
    expect(lowerCaseFirstLetter("already")).toBe("already");
  });

  it("lowerCaseFirstLetter: returns empty string for null/undefined", () => {
    expect(lowerCaseFirstLetter(null)).toBe("");
    expect(lowerCaseFirstLetter(undefined)).toBe("");
  });

  // --- Constants ---

  it("VALUE_FROM: has all expected value modes", () => {
    expect(VALUE_FROM.CONTEXT).toBe("context");
    expect(VALUE_FROM.SELF).toBe("self");
    expect(VALUE_FROM.NONE).toBe("none");
    expect(VALUE_FROM.PROCESS).toBe("process");
    expect(VALUE_FROM.DMN).toBe("dmn");
    expect(VALUE_FROM.QUERY).toBe("query");
  });

  it("DATE_FORMAT: provides formats for date, time, datetime", () => {
    expect(DATE_FORMAT.date).toContain("YYYY");
    expect(DATE_FORMAT.time).toContain("HH");
    expect(DATE_FORMAT.datetime).toContain("YYYY");
    expect(DATE_FORMAT.datetime).toContain("HH");
  });

  it("excludedFields: includes standard audit fields", () => {
    expect(excludedFields).toContain("createdBy");
    expect(excludedFields).toContain("updatedOn");
    expect(excludedFields).toContain("version");
    expect(excludedFields).toContain("id");
  });
});
