import React, { useEffect, useState } from "react";
import { Select, Badge, MenuItem } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

interface StaticSelectOption {
  id?: string | number;
  name?: string;
  title?: string;
  color?: string;
  border?: string;
  [key: string]: unknown;
}

interface StaticSelectProps {
  name?: string;
  value?: StaticSelectOption[];
  onChange?: (value: StaticSelectOption | null) => void;
  options?: StaticSelectOption[];
}

function StaticSelect({ value = [], onChange = () => {}, options = [] }: StaticSelectProps) {
  const [val, setVal] = useState<StaticSelectOption[]>(value);

  useEffect(() => {
    setVal(value ?? []);
  }, [value]);

  const handleSelectChange = (newValue: unknown) => {
    const arr = newValue as StaticSelectOption[] | null;
    if (!arr || arr.length === 0) {
      setVal([]);
      onChange(null);
      return;
    }
    const lastSelectedValue = arr[arr.length - 1];
    setVal(lastSelectedValue ? [lastSelectedValue] : []);
    onChange(lastSelectedValue ?? null);
  };

  return (
    <Select<StaticSelectOption, true>
      value={val}
      onChange={handleSelectChange}
      renderValue={({ option }) => (
        <Badge
          rounded="pill"
          m={1}
          p={2}
          style={{
            background: option?.color ?? undefined,
            color: option?.border || "white",
          }}
        >
          {translate(option?.title || "")}
        </Badge>
      )}
      options={options}
      optionKey={(x) => x.id ?? x.name ?? ""}
      optionLabel={(x) => x.title ?? ""}
      renderOption={({ option }) => (
        <MenuItem value={option.name} key={option.name}>
          <Badge
            key={option.name}
            rounded="pill"
            m={1}
            p={2}
            style={{
              background: option?.color ?? undefined,
              color: option?.border || "white",
            }}
          >
            {translate(option.title ?? "")}
          </Badge>
        </MenuItem>
      )}
      clearIcon={false}
      multiple
    />
  );
}

export default StaticSelect;
