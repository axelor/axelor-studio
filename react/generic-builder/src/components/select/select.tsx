import React from "react";
import { Select, Box } from "@axelor/ui";
import classNames from "classnames";

import { translate } from "../../common/utils";

import styles from "./Select.module.css";

interface OptionItem {
  name: string | boolean;
  title: string;
  id?: string | number;
  [key: string]: unknown;
}

interface SelectionProps {
  name?: string;
  value?: unknown;
  onChange: (value: unknown) => void;
  options?: OptionItem[];
  title?: string;
  className?: string;
  disableUnderline?: boolean;
  placeholder?: string;
  [key: string]: unknown;
}

export default function Selection({
  name,
  value = "",
  onChange,
  options,
  title,
  className,
  _disableUnderline = false,
  placeholder,
  ..._rest
}: SelectionProps) {
  const selectedValue = React.useMemo(() => {
    return (options || []).find((op: OptionItem) => op.name === value) || null;
  }, [options, value]);

  return (
    <Box d="flex" flexDirection="column">
      <Select
        value={selectedValue}
        // @ts-expect-error -- safety: SelectValue type mismatch in @axelor/ui Select generics
        onChange={(value: OptionItem | null) => onChange(value ? value.name : undefined)}
        name={name}
        options={options || []}
        placeholder={translate(placeholder || title || "") || ""}
        optionLabel={(option: OptionItem) => translate(option.title)}
        optionKey={(option: OptionItem) => option.id || String(option.name)}
        style={{ marginRight: 8, minWidth: 150 }}
        className={classNames(className, styles.select)}
        clearIcon={false}
      />
    </Box>
  );
}
