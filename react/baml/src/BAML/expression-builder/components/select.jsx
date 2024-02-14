import React from "react";
import { translate } from "../../../utils";
import { Box, InputLabel, Select } from "@axelor/ui";

export default function Selection({
  name,
  value = "",
  onChange,
  options,
  title,
  ...rest
}) {
  const valueOptions = options.find(({ name }) => name === value);
  const isOperator = name !== "operator";
  return (
    <Box
      d="flex"
      flexDirection="column"
      gap={8}
      me={4}
      style={{
        width: "initial",
        maxWidth: name !== "operator" ? "70px" : "120px",
      }}
    >
      <Select
        clearIcon={!isOperator}
        placeholder={translate(title)}
        options={options && Array.isArray(options) ? options : []}
        optionKey={(op) => op.name}
        optionLabel={(op) => op.title}
        value={valueOptions || ""}
        onChange={(value) => onChange(value?.name)}
        {...rest}
      />
    </Box>
  );
}
