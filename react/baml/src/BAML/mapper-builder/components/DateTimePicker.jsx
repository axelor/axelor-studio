import React from "react";
import { translate } from "../../../utils";
import { Box, Input, InputLabel } from "@axelor/ui";

function DateTimePicker({ inline, type = "date", ...props }) {
  const { name, title, format, error, onChange, value, ...other } = props;
  return (
    <Box d="flex" flexDirection="column">
      {title && !inline && (
        <InputLabel>{inline ? "" : translate(title)}</InputLabel>
      )}
      <Input
        type={type === "datetime" ? "datetime-local" : type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        invalid={error}
      />
    </Box>
  );
}

export default DateTimePicker;
