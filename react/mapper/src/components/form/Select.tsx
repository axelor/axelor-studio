import React from "react";
import classnames from "classnames";
import { Select, Box } from "@axelor/ui";

import { translate } from "../../utils";

import styles from "./Select.module.css";

interface SelectionProps {
  name?: string;
  value?: unknown;
  onChange: (value: unknown) => void;
  options?: Array<Record<string, unknown>>;
  title?: string;
  className?: string;
  error?: unknown;
  [key: string]: unknown;
}

export default function Selection({
  name,
  value = "",
  onChange,
  options,
  title,
  className,
  error,
  ...rest
}: SelectionProps) {
  const selectedValue = React.useMemo(() => {
    return (options || []).find((op) => op.name === value) || null;
  }, [value, options]);

  return (
    <Box d="flex" flexDirection="column" className={classnames(styles.formControl, className)}>
      <Select
        value={selectedValue}
        // @ts-expect-error -- safety: @axelor/ui Select onChange uses SelectValue generic mismatch
        onChange={(value: Record<string, unknown> | null) => onChange(value?.name)}
        name={name}
        className={styles.select}
        flex="1"
        placeholder={translate(title || "") || ""}
        invalid={!!error && !value}
        options={options || []}
        optionKey={(option: Record<string, unknown>) => (option.id || option.name) as string}
        optionLabel={(option: Record<string, unknown>) => translate(option.title as string)}
        {...rest}
      />
    </Box>
  );
}
