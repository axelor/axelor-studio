import React from "react";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import FieldEditor from "../field-editor/field-editor";
import { Select, Tooltip, IconButton, BooleanRadio } from "../../components";
import { JOIN_OPERATOR, BUTTON_TYPE_OPERATOR } from "../../common/constants";
import { isBPMQuery, lowerCaseFirstLetter, translate } from "../../common/utils";

import RenderWidget from "./RenderWidget";
import { ContextModelSection } from "./ContextModelSection";
import { BetweenElseSection } from "./BetweenElseSection";
import styles from "./editor.module.css";

interface ValueSourceSectionProps {
  isField: unknown;
  operator: unknown;
  expression?: string;
  parentType?: string;
  editor: Record<string, unknown>;
  isBPMN?: boolean;
  isCondition?: boolean;
  index: number;
  type: unknown;
  field: unknown;
  fieldValue: unknown;
  fieldValue2: unknown;
  metaModal: unknown;
  elseMetaModal: unknown;
  isShowMetaModelField: unknown;
  isShowElseMetaModelField: unknown;
  relatedValueFieldName: unknown;
  relatedElseValueFieldName: unknown;
  isVariable: boolean;
  parentMetaModal?: Record<string, unknown>;
  radioOptions: { label: string; value: string }[];
  nameValue: Record<string, unknown> | null;
  setNameValue: (val: Record<string, unknown>) => void;
  elseNameValue: Record<string, unknown> | null;
  setElseNameValue: (val: Record<string, unknown>) => void;
  handleChange: (name: string, value: unknown) => void;
  onChange: (e: Record<string, unknown>, editor: Record<string, unknown>) => void;
  handleOpen: (type?: string) => void;
  getMetaFields: () => Promise<Record<string, unknown>[]>;
  fetchContextModels: (e: { search?: string }) => Promise<Record<string, unknown>[]>;
  fetchMetaModels: (e: { search?: string }) => Promise<Record<string, unknown>[]>;
  fetchMetaModalField: () => Promise<Record<string, unknown>[]>;
  fetchElseMetaModalField: () => Promise<Record<string, unknown>[]>;
  getVariables: () => Promise<Record<string, unknown>[]>;
}

/**
 * ValueSourceSection handles the "Value from" radio and corresponding field editors
 * for self, context, param, and none modes inside a Rule.
 */
function ValueSourceSection({
  isField,
  operator,
  expression,
  parentType,
  editor,
  isBPMN,
  isCondition,
  index,
  type,
  field,
  fieldValue,
  fieldValue2,
  metaModal,
  elseMetaModal,
  isShowMetaModelField,
  isShowElseMetaModelField,
  relatedValueFieldName,
  relatedElseValueFieldName,
  isVariable,
  parentMetaModal,
  radioOptions,
  nameValue,
  setNameValue,
  elseNameValue,
  setElseNameValue,
  handleChange,
  onChange,
  handleOpen,
  getMetaFields,
  fetchContextModels,
  fetchMetaModels,
  fetchMetaModalField,
  fetchElseMetaModalField,
  getVariables,
}: ValueSourceSectionProps) {
  const fieldObj = (field || {}) as Record<string, unknown>;
  const showRadio =
    operator &&
    !["button", "menu-item"].includes(fieldObj.type as string) &&
    !["isNull", "isNotNull", ...(isBPMN ? ["isTrue", "isFalse"] : [])].includes(operator as string);

  const isSourceActive =
    isField &&
    !["none", "param"].includes(isField as string) &&
    operator &&
    !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator as string);

  return (
    <>
      {showRadio && (
        <BooleanRadio
          data-testid="value-source-radio"
          data={radioOptions}
          value={(isField as string) || "none"}
          title="Value from"
          index={index}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setNameValue({ fieldValue: null });
            handleChange("fieldValue", null);
            setElseNameValue({ fieldValue2: null });
            handleChange("fieldValue2", null);
            if (
              e.target.value &&
              (operator === "in" || operator === "notIn") &&
              !["none", "param"].includes(e.target.value)
            ) {
              onChange({ name: "operator", value: undefined }, editor);
              handleChange("isField", null);
              return;
            }
            if (e.target.value) {
              handleChange("isField", e.target.value);
              handleChange(
                "isRelationalValue",
                ["none", "param"].includes(e.target.value) ? null : e.target.value,
              );
              handleChange("fieldValue", null);
              handleChange("fieldValue2", null);
              if (e.target.value === "self") {
                handleChange("relatedValueModal", parentMetaModal);
                handleChange("relatedElseValueModal", parentMetaModal);
              } else {
                handleChange("relatedValueModal", null);
                handleChange("relatedElseValueModal", null);
                handleChange("isShowMetaModelField", false);
                handleChange("isShowElseMetaModelField", false);
              }
            } else {
              handleChange("relatedValueFieldName", null);
              handleChange("relatedValueModal", null);
              handleChange("relatedElseValueFieldName", null);
              handleChange("relatedElseValueModal", null);
            }
          }}
        />
      )}
      {isSourceActive ? (
        <React.Fragment>
          {isField === "context" && (
            <ContextModelSection
              metaModal={metaModal}
              isShowMetaModelField={isShowMetaModelField}
              handleChange={handleChange}
              setNameValue={setNameValue}
              fetchContextModels={fetchContextModels}
            />
          )}
          {(isShowMetaModelField || isField === "self") && (
            <FieldEditor
              isParent
              isBPM
              getMetaFields={
                isField === "context" && isBPMN
                  ? isVariable
                    ? getVariables
                    : fetchMetaModalField
                  : getMetaFields
              }
              editor={editor}
              isField={isField as string}
              onChange={(
                { value, fieldNameValue, allField, isShow }: Record<string, unknown>,
                _editor: Record<string, unknown>,
              ) => {
                const fieldVal = value as Record<string, unknown> | null;
                setNameValue({
                  allField,
                  field: value,
                  fieldName: fieldNameValue,
                  fieldType: fieldVal && fieldVal.type,
                  fieldValue: null,
                  fieldValue2: null,
                  operator: null,
                  isRelationalValue: isField === "none" ? null : isField,
                  relatedValueFieldName: null,
                  relatedValueModal: null,
                  isShow,
                  isShowMetaModelField,
                });
                handleChange("isRelationalValue", isField === "none" ? null : isField);
                handleChange("relatedValueFieldName", value);
                handleChange("relatedValueModal", metaModal);
                const isBPM = isBPMQuery(parentType);
                const isRelational = ["json-many-to-one", "MANY_TO_ONE", "many-to-one"].includes(
                  fieldVal?.type as string,
                );
                const isContextValue = isField === "context" && isBPM;
                const metaModalObj = metaModal as Record<string, unknown>;
                handleChange(
                  "fieldValue",
                  fieldNameValue
                    ? isBPM && isField === "self"
                      ? `self.${fieldNameValue}`
                      : isVariable
                        ? `${fieldNameValue}`
                        : `${lowerCaseFirstLetter(metaModalObj?.name as string)}${
                            isContextValue ? "?." : JOIN_OPERATOR[isBPM ? "BPM" : expression || ""]
                          }${fieldNameValue}${
                            fieldVal &&
                            isRelational &&
                            (isField === "context" || isField === "self")
                              ? `${isContextValue ? "?." : JOIN_OPERATOR[expression || ""]}getTarget()`
                              : ""
                          }${
                            fieldVal?.typeName && !isBPM
                              ? `${isContextValue ? "?." : JOIN_OPERATOR[expression || ""]}toLocalDateTime()`
                              : ""
                          }`
                    : undefined,
                );
              }}
              value={nameValue}
              expression={expression}
              type={parentType}
            />
          )}
          {!!(!isShowMetaModelField && metaModal && isField === "context") && (
            <IconButton
              size="small"
              onClick={() => handleChange("isShowMetaModelField", true)}
              className={styles.iconButton}
            >
              <Tooltip title={translate("Add sub field")}>
                <MaterialIcon icon="arrow_forward" color="body" fontSize={18} />
              </Tooltip>
            </IconButton>
          )}
          {["between", "notBetween"].includes(operator as string) && (
            <BetweenElseSection
              isField={isField}
              expression={expression}
              parentType={parentType}
              editor={editor}
              elseMetaModal={elseMetaModal}
              isShowMetaModelField={isShowMetaModelField}
              isShowElseMetaModelField={isShowElseMetaModelField}
              relatedValueFieldName={relatedValueFieldName}
              relatedElseValueFieldName={relatedElseValueFieldName}
              elseNameValue={elseNameValue}
              setElseNameValue={setElseNameValue}
              setNameValue={setNameValue}
              handleChange={handleChange}
              fetchMetaModels={fetchMetaModels}
              fetchElseMetaModalField={fetchElseMetaModalField}
            />
          )}
        </React.Fragment>
      ) : !isCondition && isField === "param" ? (
        <></>
      ) : (
        operator &&
        (["button", "menu-item"].includes(fieldObj.type as string) ? (
          <Select
            name="fieldValue"
            onChange={(value: unknown) => onChange({ name: "fieldValue", value }, editor)}
            value={fieldValue as string}
            options={BUTTON_TYPE_OPERATOR}
            className={styles.operators}
          />
        ) : (
          <RenderWidget
            type={(type as string) || ""}
            parentType={parentType}
            operator={operator as string}
            onChange={(e: Record<string, unknown>, editor?: unknown) => {
              onChange(e, editor as Record<string, unknown>);
              handleChange("isField", isField);
              handleChange("isRelationalValue", null);
              handleChange("relatedValueFieldName", null);
              handleChange("relatedValueModal", null);
            }}
            value={{ fieldValue, fieldValue2 }}
            classes={styles}
            editor={editor}
            field={field as Record<string, unknown>}
            handleOpen={handleOpen}
          />
        ))
      )}
    </>
  );
}

export default ValueSourceSection;
