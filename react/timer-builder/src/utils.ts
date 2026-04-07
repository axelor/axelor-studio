interface DurationField {
  readonly name: string;
  readonly label: string;
  readonly designator: string;
}

export interface DurationValue {
  repeat?: number;
  startDateTime?: { format(fmt?: string): string } | null;
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  [key: string]: unknown;
}

const FIELDS: readonly DurationField[] = [
  { name: "years", label: "Years", designator: "Y" },
  { name: "months", label: "Months", designator: "M" },
  { name: "weeks", label: "Weeks", designator: "W" },
  { name: "days", label: "Days", designator: "D" },
  { name: "hours", label: "Hours", designator: "H" },
  { name: "minutes", label: "Minutes", designator: "M" },
  { name: "seconds", label: "Seconds", designator: "S" },
];

const CRON_OVERRIDE = {
  useSeconds: true,
  useYears: true,
  useBlankDay: true,
  useAliases: true,
  useLastDayOfMonth: true,
  useLastDayOfWeek: true,
  useNearestWeekday: true,
  useNthWeekdayOfMonth: true,
} as const;

// positive look behind is not supported in safari
const REGEX_FOR_REPEAT = /(?<=R)-?\d*/;
const REGEX_FOR_DATE_TIME = /(?<=\/).+?(?=\/)/;

const appendRepeat = (expression: string, value: DurationValue): string => {
  const INVALID_DATE = "Invalid Date";
  let dateString = value.startDateTime?.format() || INVALID_DATE;
  dateString = dateString.toLowerCase() === INVALID_DATE.toLowerCase() ? "" : dateString;

  return "R" + (value.repeat ?? "") + "/" + (dateString ? dateString + "/" : "") + expression;
};

const generateISO8601Expression = (value: DurationValue, shouldAppendRepeat: boolean): string => {
  const expression =
    FIELDS.reduce((acc: string, field) => {
      return value[field.name]
        ? acc +
            (!acc.includes("P") ? "P" : "") +
            (["hours", "minutes", "seconds"].includes(field.name) && !acc.includes("T")
              ? "T"
              : "") +
            String(value[field.name]) +
            field.designator
        : acc;
    }, "") || "PT0S";

  return shouldAppendRepeat ? appendRepeat(expression, value) : expression;
};

function validateIsoDuration(duration: string): boolean {
  const hasWeeks = duration.includes("W");
  const hasOtherComponents = ["Y", "M", "D", "H", "M", "S"].some((unit) => duration.includes(unit));
  return !(hasWeeks && hasOtherComponents);
}

const TYPE = {
  cron: "cron",
  iso: "iso",
  unknown: "unknown",
  empty: "empty",
} as const;

export {
  FIELDS,
  CRON_OVERRIDE,
  REGEX_FOR_DATE_TIME,
  REGEX_FOR_REPEAT,
  generateISO8601Expression,
  validateIsoDuration,
  TYPE,
};
