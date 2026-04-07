import React from "react";
import { Box, Input, InputLabel } from "@axelor/ui";

import { translate } from "../i18n/index";

interface RadioOption {
  value: string;
  label: string;
}

interface BooleanRadioProps {
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
  data: RadioOption[];
  title?: string;
  index?: number | string;
  [key: string]: unknown;
}

export function BooleanRadio({
  _name,
  onChange,
  value: valueProp,
  data,
  title,
  index: key,
  ...other
}: BooleanRadioProps) {
  return (
    <Box
      d="flex"
      flexDirection={title ? "column" : "row"}
      alignItems={title ? undefined : "center"}
      ms={1}
      me={1}
      {...other}
    >
      {title && <InputLabel color="body">{translate(title)}</InputLabel>}
      {data.map(({ value, label }: RadioOption, index: number) => (
        <Box d="flex" alignItems="center" key={index} me={2}>
          <Input
            type="radio"
            value={value}
            checked={value === valueProp}
            onChange={onChange}
            id={key != null ? `${value}-${key}` : value}
            m={0}
            me={2}
          />
          <InputLabel mb={0} htmlFor={key != null ? `${value}-${key}` : value}>
            {translate(label)}
          </InputLabel>
        </Box>
      ))}
    </Box>
  );
}
