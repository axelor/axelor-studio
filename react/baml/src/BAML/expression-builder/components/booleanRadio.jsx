import React from "react";
import { Box, Input, InputLabel } from "@axelor/ui";
import { translate } from "../../../utils";

export function BooleanRadio({
  name,
  onChange,
  value: valueProp,
  data,
  title,
  index: key,
  ...other
}) {
  return (
    <Box d="flex" flexDirection="column" ms={1} me={1} {...other}>
      {title && (
        <InputLabel fontSize="small" color="body">
          {translate(title)}
        </InputLabel>
      )}
      {data.map(({ value, label }, index) => (
        <Box d="flex" alignItems="center" key={index} me={2}>
          <Input
            type="radio"
            value={value}
            checked={value === valueProp}
            onChange={onChange}
            m={0}
            me={2}
          />
          <InputLabel mb={0}>{translate(label)}</InputLabel>
        </Box>
      ))}
    </Box>
  );
}
