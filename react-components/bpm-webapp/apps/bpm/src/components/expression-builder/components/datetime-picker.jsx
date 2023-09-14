import React, { useState } from "react";
import MomentUtils from "@date-io/moment";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDateTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { dateFormat } from "../extra/data";
import { translate } from "../../../utils";

const PICKERS = {
  date: KeyboardDatePicker,
  time: KeyboardTimePicker,
  datetime: KeyboardDateTimePicker,
};

function DateTimePicker({
  inline,
  type = "date",
  disableUnderline = false,
  className,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const { name, title, format, error, onChange, ...other } = props;
  const Picker = PICKERS[type];

  function onKeyDown(e) {
    if (e.keyCode === 40) setOpen(true);
  }

  function onClose() {
    setOpen(false);
  }

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Picker
        autoOk={true}
        open={open}
        ampm={false}
        views={
          type === "date"
            ? ["date"]
            : type === "datetime"
            ? ["date", "hours", "minutes", "seconds"]
            : type === "time"
            ? ["hours", "minutes", "seconds"]
            : ["date"]
        }
        InputProps={{
          disableUnderline,
        }}
        onChange={(value) => onChange(value)}
        PopoverProps={{
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
        }}
        disableToolbar
        variant="inline"
        {...(inline ? { invalidDateMessage: "" } : {})}
        className={className}
        style={{ width: "100%", ...(inline ? { margin: 0 } : {}) }}
        label={inline ? "" : translate(title)}
        format={format || dateFormat[type]}
        {...(type !== "time" ? { animateYearScrolling: false } : {})}
        {...other}
        onKeyDown={onKeyDown}
        onClose={onClose}
        onOpen={() => setOpen(true)}
      />
    </MuiPickersUtilsProvider>
  );
}

export default DateTimePicker;
