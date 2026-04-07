import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import FieldEditor from "../field-editor/field-editor";
import { Selection, Tooltip, IconButton } from "../../components";
import { JOIN_OPERATOR } from "../../common/constants";
import { isBPMQuery, lowerCaseFirstLetter, translate } from "../../common/utils";

import styles from "./editor.module.css";

/** Between/notBetween "else" value section with context model and field editor */
interface BetweenElseSectionProps {
  isField: unknown;
  expression?: string;
  parentType?: string;
  editor: Record<string, unknown>;
  elseMetaModal: unknown;
  isShowMetaModelField: unknown;
  isShowElseMetaModelField: unknown;
  relatedValueFieldName: unknown;
  relatedElseValueFieldName: unknown;
  elseNameValue: Record<string, unknown> | null;
  setElseNameValue: (val: Record<string, unknown>) => void;
  setNameValue: (val: Record<string, unknown>) => void;
  handleChange: (name: string, value: unknown) => void;
  fetchMetaModels: (e: { search?: string }) => Promise<Record<string, unknown>[]>;
  fetchElseMetaModalField: () => Promise<Record<string, unknown>[]>;
}

export function BetweenElseSection({
  isField,
  expression,
  parentType,
  editor,
  elseMetaModal,
  isShowMetaModelField,
  isShowElseMetaModelField,
  relatedValueFieldName,
  relatedElseValueFieldName,
  elseNameValue,
  setElseNameValue,
  setNameValue,
  handleChange,
  fetchMetaModels,
  fetchElseMetaModalField,
}: BetweenElseSectionProps) {
  return (
    <React.Fragment>
      {isField === "context" && (
        <React.Fragment>
          <Selection
            name="metaModal"
            title="Meta model else"
            placeholder="Meta model else"
            fetchAPI={fetchMetaModels}
            optionLabelKey="name"
            onChange={(e: unknown) => {
              const eObj = e as Record<string, unknown>;
              handleChange("relatedElseValueModal", e);
              if (eObj) {
                setElseNameValue({ fieldValue2: lowerCaseFirstLetter(eObj.name as string) });
                handleChange("fieldValue2", lowerCaseFirstLetter(eObj.name as string));
              } else {
                setElseNameValue({ fieldValue2: null });
                handleChange("fieldValue2", null);
              }
            }}
            value={elseMetaModal}
            classes={{ root: styles.MuiAutocompleteRoot }}
          />
          {!!isShowElseMetaModelField && (
            <IconButton
              size="small"
              onClick={() => {
                handleChange("isShowElseMetaModelField", false);
                if (!elseMetaModal) return;
                const model = (elseMetaModal as Record<string, unknown>).name as string;
                setNameValue({ fieldValue: lowerCaseFirstLetter(model) });
                handleChange("relatedElseValueModal", elseMetaModal);
                handleChange("fieldValue2", lowerCaseFirstLetter(model));
              }}
              className={styles.iconButton}
            >
              <Tooltip title={translate("Remove sub field")}>
                <MaterialIcon icon="close" color="body" fontSize={18} />
              </Tooltip>
            </IconButton>
          )}
        </React.Fragment>
      )}
      {(isShowElseMetaModelField || isField === "self") && (
        <FieldEditor
          getMetaFields={fetchElseMetaModalField}
          editor={editor}
          isField={isField as string}
          onChange={(
            { value, fieldNameValue, allField, isShow }: Record<string, unknown>,
            _editor: Record<string, unknown>,
          ) => {
            const fieldVal = value as Record<string, unknown> | null;
            setElseNameValue({
              allField,
              field: value,
              fieldName: fieldNameValue,
              fieldType: fieldVal && fieldVal.type,
              fieldValue: null,
              fieldValue2: null,
              operator: null,
              isRelationalValue: isField === "none" ? null : isField,
              relatedValueFieldName,
              relatedValueModal: elseMetaModal,
              relatedElseValueFieldName,
              relatedElseValueModal: elseMetaModal,
              isShow,
              isShowMetaModelField,
              isShowElseMetaModelField,
            });
            handleChange("relatedElseValueFieldName", value);
            handleChange("relatedElseValueModal", elseMetaModal);
            const isBPM = isBPMQuery(parentType);
            const isContextValue = isField === "context" && isBPM;
            const elseMetaModalObj = elseMetaModal as Record<string, unknown>;
            handleChange(
              "fieldValue2",
              fieldNameValue
                ? isBPM && isField === "self"
                  ? `self.${fieldNameValue}`
                  : `${lowerCaseFirstLetter(elseMetaModalObj && (elseMetaModalObj.name as string))}${
                      isContextValue ? "?." : JOIN_OPERATOR[isBPM ? "BPM" : expression || ""]
                    }${fieldNameValue}${
                      fieldVal &&
                      ["json-many-to-one", "MANY_TO_ONE", "many-to-one"].includes(
                        fieldVal.type as string,
                      ) &&
                      isBPM &&
                      isField === "context"
                        ? `${isContextValue ? "?." : JOIN_OPERATOR[expression || ""]}getTarget()`
                        : ""
                    }${
                      fieldVal && fieldVal.typeName && !isBPM
                        ? `${isContextValue ? "?." : JOIN_OPERATOR[expression || ""]}toLocalDateTime()`
                        : ""
                    }`
                : undefined,
            );
          }}
          value={elseNameValue}
          expression={expression}
          type={parentType}
          isParent
          isBPM
        />
      )}
      {!!(!isShowElseMetaModelField && elseMetaModal && isField === "context") && (
        <IconButton
          size="small"
          onClick={() => handleChange("isShowElseMetaModelField", true)}
          className={styles.iconButton}
        >
          <Tooltip title={translate("Add sub field")}>
            <MaterialIcon icon="arrow_forward" color="body" fontSize={18} />
          </Tooltip>
        </IconButton>
      )}
    </React.Fragment>
  );
}
