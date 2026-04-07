import { describe, it, expect } from "vitest";

import {
  FIELDS,
  CRON_OVERRIDE,
  TYPE,
  generateISO8601Expression,
  validateIsoDuration,
} from "../utils";

describe("utils.js characterization tests", () => {
  describe("TYPE constants", () => {
    it("should have exactly 4 types", () => {
      expect(TYPE).toEqual({
        cron: "cron",
        iso: "iso",
        unknown: "unknown",
        empty: "empty",
      });
    });
  });

  describe("CRON_OVERRIDE shape", () => {
    it("should have all expected override flags", () => {
      expect(CRON_OVERRIDE).toEqual({
        useSeconds: true,
        useYears: true,
        useBlankDay: true,
        useAliases: true,
        useLastDayOfMonth: true,
        useLastDayOfWeek: true,
        useNearestWeekday: true,
        useNthWeekdayOfMonth: true,
      });
    });
  });

  describe("FIELDS", () => {
    it("should have 7 fields in order", () => {
      expect(FIELDS).toHaveLength(7);
      expect(FIELDS.map((f) => f.name)).toEqual([
        "years",
        "months",
        "weeks",
        "days",
        "hours",
        "minutes",
        "seconds",
      ]);
    });
  });

  describe("generateISO8601Expression", () => {
    it("returns PT0S for empty input", () => {
      expect(generateISO8601Expression({}, false)).toBe("PT0S");
    });

    it("generates years only", () => {
      expect(generateISO8601Expression({ years: 5 }, false)).toBe("P5Y");
    });

    it("generates months only", () => {
      expect(generateISO8601Expression({ months: 3 }, false)).toBe("P3M");
    });

    it("generates weeks only", () => {
      expect(generateISO8601Expression({ weeks: 2 }, false)).toBe("P2W");
    });

    it("generates days only", () => {
      expect(generateISO8601Expression({ days: 10 }, false)).toBe("P10D");
    });

    it("generates hours + minutes with T separator", () => {
      expect(generateISO8601Expression({ hours: 2, minutes: 30 }, false)).toBe("PT2H30M");
    });

    it("generates seconds only with T separator", () => {
      expect(generateISO8601Expression({ seconds: 45 }, false)).toBe("PT45S");
    });

    it("generates full date + time expression", () => {
      expect(
        generateISO8601Expression(
          { years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 },
          false,
        ),
      ).toBe("P1Y2M3DT4H5M6S");
    });

    it("appends repeat when shouldAppendRepeat is true", () => {
      const value = { hours: 1, repeat: 3 };
      const result = generateISO8601Expression(value, true);
      expect(result).toBe("R3/PT1H");
    });

    it("appends repeat with no repeat count", () => {
      const value = { hours: 1 };
      const result = generateISO8601Expression(value, true);
      expect(result).toBe("R/PT1H");
    });

    it("appends repeat with startDateTime", () => {
      const mockMoment = { format: () => "2023-01-01T00:00:00+01:00" };
      const value = { hours: 1, repeat: 2, startDateTime: mockMoment };
      const result = generateISO8601Expression(value, true);
      expect(result).toBe("R2/2023-01-01T00:00:00+01:00/PT1H");
    });
  });

  describe("validateIsoDuration", () => {
    it("returns true for pure weeks P2W", () => {
      // P2W contains no Y,M,D,H,S — hasOtherComponents checks ["Y","M","D","H","M","S"]
      // "P2W" does NOT contain any of those letters, so hasOtherComponents=false -> returns true
      expect(validateIsoDuration("P2W")).toBe(true);
    });

    it("returns false for weeks combined with hours P2WT1H", () => {
      expect(validateIsoDuration("P2WT1H")).toBe(false);
    });

    it("returns true for duration without weeks PT30M", () => {
      expect(validateIsoDuration("PT30M")).toBe(true);
    });

    it("returns true for simple duration P1Y", () => {
      expect(validateIsoDuration("P1Y")).toBe(true);
    });

    it("returns true for complex duration without weeks P1Y2M3DT4H5M6S", () => {
      expect(validateIsoDuration("P1Y2M3DT4H5M6S")).toBe(true);
    });

    it("returns false for weeks with days P2W3D", () => {
      expect(validateIsoDuration("P2W3D")).toBe(false);
    });

    // Lock the known bug: M matches both Months and Minutes in the check array
    // The check array is ["Y","M","D","H","M","S"] — note M appears twice
    // For "P2W3M", hasWeeks=true, hasOtherComponents=true (M matches) -> false
    // This is actually correct behavior for months, but the bug is that
    // "P2W" with only minutes would also fail if minutes were present
    it("returns false for weeks with months P2W3M (known M ambiguity)", () => {
      expect(validateIsoDuration("P2W3M")).toBe(false);
    });

    it("returns true for PT0S (empty/default)", () => {
      expect(validateIsoDuration("PT0S")).toBe(true);
    });
  });
});
