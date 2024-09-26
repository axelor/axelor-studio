import React, { useEffect, useState } from "react";
import moment from "moment";

import {
  parseString,
  getDateString,
} from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";
import { DateTimePicker } from "../../expression-builder/components";
import { translate } from "../../../utils";
import { InputLabel } from "@axelor/ui";
import styles from "./datepicker.module.css";

const formats = {
  date: "YYYY/MM/DD",
  time: "HH:mm:ss",
  datetime: "YYYY/MM/DD HH:mm:ss",
};

const dateFormat = (date, type) => {
  if (!date) return;
  if (type === "date") {
    return moment(moment(date).format("YYYY-MM-DD")).format(
      "YYYY-MM-DDTHH:mm:ss"
    );
  }
  return moment(date).format("YYYY-MM-DDTHH:mm:ss");
};

function DatePicker({ type, entry }) {
  const { label, set, get } = entry || {};

  const [date, setDate] = useState(null);

  useEffect(() => {
    const { defaultValue } = get && get();
    if (!defaultValue) return;
    const date = parseString(defaultValue)?.date;
    if (!date) return;
    const parsedDate = moment(date, formats[type]);
    setDate(parsedDate);
  }, [get, type]);

  const handleChange = (value) => {
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
        onChange={(value) => handleChange(value)}
        value={date}
      />
    </React.Fragment>
  );
}

export default DatePicker;
