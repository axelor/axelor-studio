const FIELDS = [
  { name: "years", label: "Years", designator: "Y" },
  { name: "months", label: "Months", designator: "M" },
  { name: "weeks", label: "Weeks", designator: "W" },
  { name: "days", label: "Days", designator: "D" },
  { name: "hours", label: "Hours", designator: "H" },
  { name: "minutes", label: "Minutes", designator: "M" },
  { name: "seconds", label: "Seconds", designator: "S" },
]

const CRON_OVERRIDE = {
  useSeconds: true,
  useYears: true,
  useBlankDay: true,
  useAliases: true,
  useLastDayOfMonth: true,
  useLastDayOfWeek: true,
  useNearestWeekday: true,
  useNthWeekdayOfMonth: true,
}
// positive look behind is not supported in safari
const REGEX_FOR_REPEAT = /(?<=R)-?\d*/
const REGEX_FOR_DATE_TIME = /(?<=\/).+?(?=\/)/

const appendRepeat = (string, value) => {
  const INVALID_DATE = "Invalid Date"
  let dateString = value.startDateTime?.format() || INVALID_DATE
  dateString =
    dateString.toLowerCase() === INVALID_DATE.toLowerCase() ? "" : dateString

  return (
    "R" +
    (value.repeat ?? "") +
    "/" +
    (dateString ? dateString + "/" : "") +
    string
  )
}

const generateISO8601Expression = (value, shouldAppendRepeat) => {
  //npm tinyduration does this with serialize function
  const expression =
    FIELDS.reduce((acc, field) => {
      return value[field.name]
        ? acc +
            (!acc.includes("P") ? "P" : "") +
            (["hours", "minutes", "seconds"].includes(field.name) &&
            !acc.includes("T")
              ? "T"
              : "") +
            value[field.name] +
            field.designator
        : acc
    }, "") || "PT0S"

  return shouldAppendRepeat ? appendRepeat(expression, value) : expression
}

const TYPE = {
  cron: "cron",
  iso: "iso",
  unknown: "unknown",
  empty: "empty",
}

export {
  FIELDS,
  CRON_OVERRIDE,
  REGEX_FOR_DATE_TIME,
  REGEX_FOR_REPEAT,
  generateISO8601Expression,
  appendRepeat,
  TYPE,
}
