import React, { useEffect, useState } from "react";
import { Select, Badge, MenuItem } from "@axelor/ui";
import { translate } from "../utils";

function StaticSelect({ value = [], onChange, options = [] }) {
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleSelectChange = (newValue) => {
    const lastSelectedValue =
      newValue.length > 0 ? newValue[newValue.length - 1] : null;
    setVal([lastSelectedValue]);
    onChange(lastSelectedValue);
  };

  return (
    <Select
      value={val}
      onChange={handleSelectChange}
      renderValue={({ option }) => (
        <Badge
          rounded="pill"
          m={1}
          p={2}
          style={{
            background: option && option.color,
            color: (option && option.border) || "white",
          }}
        >
          {translate(option?.title || "")}
        </Badge>
      )}
      options={options}
      optionKey={(x) => x.name}
      optionLabel={(x) => x.title}
      renderOption={({ option }) => (
        <MenuItem value={option.name} key={option.name}>
          <Badge
            key={option.name}
            rounded="pill"
            m={1}
            p={2}
            style={{
              background: option && option.color,
              color: (option && option.border) || "white",
            }}
          >
            {translate(option.title)}
          </Badge>
        </MenuItem>
      )}
      clearIcon={false}
      multiple
    />
  );
}

StaticSelect.defaultProps = {
  value: [],
  onChange: () => {},
};

export default StaticSelect;
