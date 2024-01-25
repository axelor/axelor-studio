import React from "react";
import { translate } from "../../../utils";
import { Input, InputFeedback } from "@axelor/ui";
import moment from "moment";

function DateTimePicker({ inline, type = "date", className, ...props }) {
  const { name, title, error, onChange, value, ...other } = props;

  const momentFormat = type === "datetime" ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD";

  return (
    <>
      <Input
        name={name}
        type={type === "datetime" ? "datetime-local" : type}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        w={100}
        invalid={error}
        value={value ? moment(value).format(momentFormat) : ""}
        style={{
          padding: "0.375rem 0.75rem",
          ...(inline ? { margin: 0 } : {}),
        }}
        placeholder={inline ? "" : translate(title)}
        rounded
        {...other}
      />
      {error && !inline && <InputFeedback invalid>Invalid date</InputFeedback>}
    </>
  );
}

export default DateTimePicker;
