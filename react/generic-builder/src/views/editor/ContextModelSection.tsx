import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Selection, Tooltip, IconButton } from "../../components";
import { VAR_TYPES } from "../../common/constants";
import { lowerCaseFirstLetter, translate } from "../../common/utils";

import styles from "./editor.module.css";

/** Context model selection + remove sub-field button */
interface ContextModelSectionProps {
  metaModal: unknown;
  isShowMetaModelField: unknown;
  handleChange: (name: string, value: unknown) => void;
  setNameValue: (val: Record<string, unknown>) => void;
  fetchContextModels: (e: { search?: string }) => Promise<Record<string, unknown>[]>;
}

export function ContextModelSection({
  metaModal,
  isShowMetaModelField,
  handleChange,
  setNameValue,
  fetchContextModels,
}: ContextModelSectionProps) {
  return (
    <React.Fragment>
      <Selection
        data-testid="value-source-context-model"
        name="metaModal"
        title="Meta model"
        placeholder="Meta model"
        fetchAPI={fetchContextModels}
        optionLabelKey="name"
        onChange={(e: unknown) => {
          handleChange("relatedValueModal", e);
          const eObj = e as Record<string, unknown>;
          if (eObj && (Object.values(VAR_TYPES) as string[]).includes(eObj.type as string)) {
            const fieldValue = `${lowerCaseFirstLetter(eObj?.name as string)}?.getTarget()`;
            setNameValue({ fieldValue });
            handleChange("fieldValue", fieldValue);
          } else {
            setNameValue({ fieldValue: null });
            handleChange("fieldValue", null);
          }
        }}
        value={metaModal}
        classes={{ root: styles.MuiAutocompleteRoot }}
      />
      {!!isShowMetaModelField && (
        <IconButton
          size="small"
          onClick={() => {
            handleChange("isShowMetaModelField", false);
            if (!metaModal) return;
            const metaModalObj = metaModal as Record<string, unknown>;
            const isVariableOption = (Object.values(VAR_TYPES) as string[]).includes(
              metaModalObj.type as string,
            );
            if (!isVariableOption) {
              const fieldValue = `${lowerCaseFirstLetter(metaModalObj.name as string)}?.getTarget()`;
              setNameValue({ fieldValue });
              handleChange("relatedValueModal", metaModal);
              handleChange("fieldValue", fieldValue);
            } else {
              setNameValue({ fieldValue: null });
              handleChange("fieldValue", null);
            }
          }}
          className={styles.iconButton}
        >
          <Tooltip title={translate("Remove sub field")}>
            <MaterialIcon icon="close" color="body" fontSize={18} />
          </Tooltip>
        </IconButton>
      )}
    </React.Fragment>
  );
}
