import React, { useEffect, useState } from "react";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";

import {
  parseString,
  getDateString,
} from "dmn-js-decision-table/lib/features/simple-date-edit/Utils";

import { DateTimePicker } from "../../expression-builder/components";
import { translate } from "../../../utils";
import { InputLabel } from "@axelor/ui";

const useStyles = makeStyles({
  input: {
    border: "1px solid #ccc",
    margin: "5px 0px",
    padding: "0px 5px",
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    marginTop: 5,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
});

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

  const classes = useStyles();

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
      <InputLabel color="body" className={classes.label}>
        {translate(label)}
      </InputLabel>
      <DateTimePicker
        type={type}
        className={classes.input}
        disableUnderline={true}
        onChange={(value) => handleChange(value)}
        value={date}
      />
    </React.Fragment>
  );
}

export default DatePicker;
