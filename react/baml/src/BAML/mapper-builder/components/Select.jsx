import React from "react";
import { translate } from "../../../utils";
import { Box, InputLabel, Select } from "@axelor/ui";

export default function Selection({
  name,
  value = "",
  onChange,
  options,
  title,
}) {
  const optionValue = options.find((option) => option.name === value);
  return (
    <Box d="flex" flexDirection="column" gap={8} style={{ width: "initial" }}>
      <InputLabel>{translate(title)}</InputLabel>
      <Select
        value={optionValue ?? {}}
        onChange={({ name }) => {
          onChange(name);
        }}
        name={name}
        style={{ marginRight: 8 }}
        options={options && Array.isArray(options) ? options : []}
        optionKey={(op) => op.name}
        optionLabel={(op) => op.title}
        clearIcon={false}
      />
    </Box>
  );
}
