import React, { useEffect, useState } from "react";

// dayjs and dmn-js-decision-table are DMN-specific peer dependencies.
// This component is NOT re-exported from the barrel; import directly via sub-path.
import dayjs from "dayjs";
import type { Dayjs, ConfigType } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import {
  parseString,
  getDateString,
} from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";
import { InputLabel } from "@axelor/ui";

import { DateTimePicker } from "../DateTimePicker";
import { translate } from "../../i18n/index";


import styles from "./datepicker.module.css";

type DateType = "date" | "time" | "datetime";

const formats: Record<DateType, string> = {
  date: "YYYY/MM/DD",
  time: "HH:mm:ss",
  datetime: "YYYY/MM/DD HH:mm:ss",
};

const dateFormat = (date: ConfigType, type: DateType): string | undefined => {
  if (!date) return;
  if (type === "date") {
    return dayjs(dayjs(date).format("YYYY-MM-DD")).format("YYYY-MM-DDTHH:mm:ss");
  }
  return dayjs(date).format("YYYY-MM-DDTHH:mm:ss");
};

interface DatePickerEntry {
  label: string;
  set?: (value: string | undefined) => void;
  get?: () => { defaultValue?: string };
}

interface DatePickerProps {
  type: DateType;
  entry: DatePickerEntry;
}

function DatePicker({ type, entry }: DatePickerProps) {
  const { label, set, get } = entry || ({} as DatePickerEntry);

  const [date, setDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    const result = get && get();
    const { defaultValue } = result || {};
    if (!defaultValue) return;
    const parsedResult = parseString(defaultValue);
    const dateStr = parsedResult?.date;
    if (!dateStr) return;
    const parsedDate = dayjs(dateStr, formats[type]);
    setDate(parsedDate);
  }, [get, type]);

  const handleChange = (value: Dayjs | null) => {
    setDate(value);
    if (set) {
      if (!value) {
        set(undefined);
        return;
      }
      set(getDateString("exact", [dateFormat(value, type)]));
    }
  };
  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate(label)}
      </InputLabel>
      <DateTimePicker
        type={type}
        className={styles.input}
        disableUnderline={true}
        onChange={(value: Dayjs | null) => handleChange(value)}
        value={date}
      />
    </React.Fragment>
  );
}

export default DatePicker;
