import { describe, it, expect } from "vitest";

import { localization } from "../localization";

describe("localization split verification", () => {
  it("localization.fr exists and has keys common, tabs, quartz, unix", () => {
    expect(localization.fr).toBeDefined();
    expect(Object.keys(localization.fr)).toEqual(["common", "tabs", "quartz", "unix"]);
  });

  it("localization.en exists and has keys common, tabs, quartz, unix", () => {
    expect(localization.en).toBeDefined();
    expect(Object.keys(localization.en)).toEqual(["common", "tabs", "quartz", "unix"]);
  });

  it("localization.fr.common.month.january === 'Janvier'", () => {
    expect(localization.fr.common.month.january).toBe("Janvier");
  });

  it("localization.en.common.month.january === 'January'", () => {
    expect(localization.en.common.month.january).toBe("January");
  });

  it("localization.fr.tabs has expected tab keys", () => {
    expect(Object.keys(localization.fr.tabs)).toEqual([
      "seconds",
      "minutes",
      "hours",
      "day",
      "month",
      "year",
    ]);
  });

  it("localization.en.quartz.day has all expected sub-keys", () => {
    const dayKeys = Object.keys(localization.en.quartz.day);
    expect(dayKeys).toContain("every");
    expect(dayKeys).toContain("dayOfWeekIncrement");
    expect(dayKeys).toContain("dayOfMonthIncrement");
    expect(dayKeys).toContain("dayOfWeekAnd");
    expect(dayKeys).toContain("dayOfWeekRange");
    expect(dayKeys).toContain("dayOfMonthAnd");
    expect(dayKeys).toContain("dayOfMonthLastDay");
    expect(dayKeys).toContain("dayOfMonthLastDayWeek");
    expect(dayKeys).toContain("dayOfWeekLastNTHDayWeek");
    expect(dayKeys).toContain("dayOfMonthDaysBeforeEndMonth");
    expect(dayKeys).toContain("dayOfMonthNearestWeekDayOfMonth");
    expect(dayKeys).toContain("dayOfWeekNTHWeekDayOfMonth");
  });

  it("has only fr and en locales", () => {
    expect(Object.keys(localization)).toEqual(["fr", "en"]);
  });
});
