import React from "react";
import { Select } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";
import { InputLabel } from "@axelor/ui";

import { BOOLEAN_OPTIONS } from "../../constants";
import styles from "../render-type.module.css";

import type { BooleanTypeEditorProps } from "./types";

export default function BooleanTypeEditor({
  updateDRDCell,
  ruleValue,
  rule,
  defaultType,
}: BooleanTypeEditorProps) {
  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Value")}
      </InputLabel>
      <Select
        name="boolean"
        update={(value: Record<string, unknown> | null) => {
          updateDRDCell(
            ruleValue as Record<string, unknown>,
            rule,
            ((value && value.id) as string) || "",
          );
        }}
        value={defaultType}
        options={BOOLEAN_OPTIONS}
        isLabel={false}
        optionLabel={"name"}
      />
    </React.Fragment>
  );
}
