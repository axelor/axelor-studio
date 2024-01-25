import React from "react";
import { Box, Input, InputLabel } from "@axelor/ui";

export function BooleanRadio({
  name,
  onChange,
  value: valueProp,
  data,
  ...other
}) {
  return (
    <Box d="flex" alignItems="center" ms={1} me={1} {...other}>
      {data.map(({ value, label }, index) => (
        <Box d="flex" alignItems="center" key={index} me={2}>
          <Input
            type="radio"
            value={value}
            checked={value === valueProp}
            onChange={onChange}
            id={value}
            m={0}
            me={2}
          />
          <InputLabel mb={0} htmlFor={value}>
            {label}
          </InputLabel>
        </Box>
      ))}
    </Box>
  );
}
