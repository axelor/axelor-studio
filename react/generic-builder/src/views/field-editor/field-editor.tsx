import React, { useCallback, useEffect, useState } from "react";
import classnames from "classnames";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Tooltip, Selection, IconButton } from "../../components";
import { getSubMetaField } from "../../services/field-service";
import { translate, isBPMQuery } from "../../common/utils";
import { JOIN_OPERATOR } from "../../common/constants";

import styles from "./field-editor.module.css";

interface FieldEditorProps {
  initValue?: string;
  getMetaFields: () => Promise<Record<string, unknown>[]>;
  editor: Record<string, unknown>;
  onChange: (e: Record<string, unknown>, editor: Record<string, unknown>) => void;
  value: Record<string, unknown> | null;
  classNames?: { root?: string } | null;
  expression?: string;
  type?: string;
  isParent?: boolean;
  isBPM?: boolean;
  isField?: unknown;
  setInitialField?: () => void;
  isAllowButtons?: boolean;
}

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  editor,
  onChange,
  value,
  classNames: classNamesProp,
  expression: parentExpression = "GROOVY",
  type,
  isParent = false,
  isBPM,
  isField,
  setInitialField = () => {},
  isAllowButtons = false,
}: FieldEditorProps) {
  const { fieldName = "", allField = [] } = value || {};
  const [fields, setFields] = useState<Record<string, unknown>[]>([]);
  const isContextValue = isField === "context" && isBPMQuery(type) && isBPM;
  const expression = isBPMQuery(type) ? "BPM" : parentExpression;
  const [isShow, setShow] = useState<boolean | null>(null);

  const values = React.useMemo(() => {
    return (
      fieldName &&
      JOIN_OPERATOR[expression] &&
      (fieldName as string).split(isContextValue ? "?." : JOIN_OPERATOR[expression])
    );
  }, [isContextValue, fieldName, expression]);

  const [startValue] = (values as string[]) || [];
  const hasManyValues: boolean = !!(
    fieldName &&
    isParent &&
    fields &&
    fields.some((x) => x.name === startValue)
  );
  const relationModel = (
    hasManyValues
      ? (fields.find((x) => x.name === startValue) || ({} as Record<string, unknown>)).target
      : undefined
  ) as string | undefined;
  const relationJsonModel = (
    hasManyValues
      ? (fields.find((x) => x.name === startValue) || ({} as Record<string, unknown>)).jsonTarget
      : undefined
  ) as string | undefined;
  const fieldType = (
    (fields && fields.find((x) => x.name === startValue)) ||
    ({} as Record<string, unknown>)
  ).type as string | undefined;
  const isM2MField =
    (allField as Record<string, unknown>[]) &&
    (allField as Record<string, unknown>[]).length > 0 &&
    (allField as Record<string, unknown>[]).find((f: Record<string, unknown>) =>
      ["many_to_many", "json_many_to_many"].includes(
        (f && ((f.type as string) || "")).toLowerCase().replaceAll("-", "_"),
      ),
    );
  const isM2OField =
    (allField as Record<string, unknown>[]) &&
    (allField as Record<string, unknown>[]).length > 0 &&
    (allField as Record<string, unknown>[]).find((f: Record<string, unknown>) =>
      ["many_to_one", "json_many_to_one"].includes(
        (f && ((f.type as string) || "")).toLowerCase().replaceAll("-", "_"),
      ),
    );
  const isOneToOne = ["one_to_one", "json_one_to_one"].includes(
    ((fieldType || "")).toLowerCase().replaceAll("-", "_"),
  );

  const getUpdatedValue = () => {
    const spiltedValues = initValue && initValue.split(JOIN_OPERATOR[expression]);
    return (
      spiltedValues &&
      spiltedValues.length > 0 &&
      (spiltedValues.filter(Boolean) || []).join(JOIN_OPERATOR[expression])
    );
  };

  function handleChange(value: Record<string, unknown> | null) {
    setInitialField();
    const isRelationalField = value && fields.some((x) => x.name === value.name && x.target);
    if (isBPM) {
      let allFields: Record<string, unknown>[];
      const newFieldName = isParent
        ? value && value.name
          ? `${initValue}${value.name}`
          : `${getUpdatedValue()}`
        : value && value.name
          ? `${
              isRelationalField ? (isContextValue ? "?." : JOIN_OPERATOR[expression]) : ""
            }${initValue}${value.name}`
          : "";
      if (
        value &&
        (allField as Record<string, unknown>[]).findIndex(
          (f: Record<string, unknown>) => f.name === value.name,
        ) <= -1
      ) {
        const fieldNames =
          (newFieldName || "").split(isContextValue ? "?." : JOIN_OPERATOR[expression]) || [];
        const filterFields =
          ((allField as Record<string, unknown>[]) &&
            (allField as Record<string, unknown>[]).filter((f: Record<string, unknown>) =>
              fieldNames.includes(f.name as string),
            )) ||
          [];
        allFields = [...filterFields, value];
      } else {
        const fields = [...((allField as Record<string, unknown>[]) || [])];
        const fieldNames = ((fieldName as string) || "").split(
          isContextValue ? "?." : JOIN_OPERATOR[expression],
        );
        fieldNames &&
          fieldNames.length > 0 &&
          fieldNames.forEach((fName) => {
            const index = fields.findIndex((f: Record<string, unknown>) => f.name === fName);
            if (index > -1) {
              fields.splice(index, 1);
            }
          });
        allFields = fields;
      }
      onChange(
        {
          name: "fieldName",
          value,
          fieldNameValue: newFieldName ? newFieldName : undefined,
          allField: allFields,
          isShow,
        },
        editor,
      );
      return;
    }
    let newFieldName: string = isParent
      ? `${initValue}${value ? value.name : ""}`
      : value && value.name
        ? `${isRelationalField ? JOIN_OPERATOR[expression] : ""}${initValue}${
            value ? value.name : ""
          }`
        : "";
    newFieldName = isBPMQuery(type)
      ? value && value.name
        ? newFieldName
        : (newFieldName).slice(0, -1)
      : (newFieldName);
    onChange(
      {
        name: "fieldName",
        value: newFieldName,
      },
      editor,
    );
    onChange({ name: "fieldType", value: (value && value.type) || "" }, editor);
    onChange({ name: "field", value }, editor);
    onChange({ name: "isShow", value: isShow }, editor);
    if (
      value &&
      (allField as Record<string, unknown>[]).findIndex(
        (f: Record<string, unknown>) => f.name === value.name,
      ) <= -1
    ) {
      const fieldNames = ((newFieldName) || "").split(JOIN_OPERATOR[expression]) || [];
      const allFields =
        ((allField as Record<string, unknown>[]) &&
          (allField as Record<string, unknown>[]).filter((f: Record<string, unknown>) =>
            fieldNames.includes(f.name as string),
          )) ||
        [];
      onChange({ name: "allField", value: [...allFields, value] }, editor);
    } else {
      let fields = [...((allField as Record<string, unknown>[]) || [])];
      const fieldNames = ((fieldName as string) || "").split(JOIN_OPERATOR[expression]);
      const initValues = `${initValue}${JOIN_OPERATOR[expression]}${startValue}`.split(
        JOIN_OPERATOR[expression],
      );
      fieldNames &&
        fieldNames.length > 0 &&
        fieldNames.forEach((fName) => {
          const index = fields.findIndex((f: Record<string, unknown>) => f.name === fName);
          if (index > -1 && !(initValues || []).includes(fName)) {
            fields.splice(index, 1);
          }
        });
      if (!value) {
        fields = fields && fields.filter((f: Record<string, unknown>) => f.name !== fieldNames[0]);
      }
      onChange({ name: "allField", value: fields }, editor);
      onChange({ name: "fieldValue", value: null }, editor);
      const val = fields?.length
        ? (fields.length === 1 ? fields[0] : fields[fields.length - 1])
        : undefined;
      onChange({ name: "fieldType", value: (val && val.type) || "" }, editor);
      onChange({ name: "field", value: val }, editor);
    }
  }
  const transformValue = useCallback(
    () =>
      (fields && fields.find((f) => f.name === startValue)) ||
      ((allField as Record<string, unknown>[]) &&
        (allField as Record<string, unknown>[]).find(
          (f: Record<string, unknown>) => f.name === startValue,
        )),
    [allField, fields, startValue],
  );
  const isM2MFields = !isBPMQuery(type)
    ? isM2MField &&
      values &&
      (values as string[]).length > 0 &&
      (values as string[]).includes((isM2MField).name as string) &&
      (values as string[])[0] !== (isM2MField).name
    : true;
  const fetchSubFields = React.useCallback(() => {
    return getSubMetaField(
      relationModel,
      !!isM2MFields,
      isBPMQuery(type),
      relationJsonModel || undefined,
      isM2OField as Record<string, unknown> | undefined,
      isBPM,
      isAllowButtons,
      (transformValue() || {}),
    );
  }, [
    relationModel,
    isM2MFields,
    type,
    relationJsonModel,
    isM2OField,
    isBPM,
    isAllowButtons,
    transformValue,
  ]);

  useEffect(() => {
    const isName =
      values &&
      (values as string[]).slice(1) &&
      (values as string[]).slice(1).join(isContextValue ? "?." : JOIN_OPERATOR[expression]);
    setShow(
      isName && !["toLocalDateTime()", "getTarget()"].includes(isName as string) ? true : false,
    );
  }, [values, isContextValue, expression]);

  useEffect(() => {
    (async () => {
      const data = await getMetaFields();
      setFields(data);
    })();
  }, [getMetaFields]);

  return (
    <React.Fragment>
      <Selection
        name="fieldName"
        title="Field name"
        placeholder="Field name"
        options={fields}
        optionLabelKey="name"
        onChange={handleChange}
        value={transformValue()}
        classes={{
          root: classnames(styles.MuiAutocompleteRoot, classNamesProp && classNamesProp.root),
        }}
      />
      {hasManyValues && relationModel && (
        <React.Fragment>
          {isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => {
                setShow((isShow) => !isShow);
                if (
                  (allField as Record<string, unknown>[]) &&
                  (allField as Record<string, unknown>[]).length > 0 &&
                  startValue
                ) {
                  const previousField = (allField as Record<string, unknown>[]).find(
                    (f: Record<string, unknown>) => f.name === startValue,
                  );
                  handleChange({
                    ...(previousField || {}),
                  });
                }
              }}
              className={styles.iconButton}
            >
              <Tooltip title={translate("Remove sub field")}>
                <MaterialIcon icon="close" color="body" fontSize={18} />
              </Tooltip>
            </IconButton>
          )}
          {(isShow || isOneToOne) && (
            <FieldEditor
              getMetaFields={fetchSubFields}
              editor={editor}
              initValue={`${initValue}${startValue}${
                isContextValue ? "?." : JOIN_OPERATOR[expression]
              }`}
              value={{
                fieldName: (values as string[])
                  .slice(1)
                  .join(isContextValue ? "?." : JOIN_OPERATOR[expression]),
                allField,
              }}
              onChange={onChange}
              classNames={classNamesProp}
              expression={expression}
              type={type}
              isParent={relationModel ? true : false}
              isBPM={isBPM}
              setInitialField={setInitialField}
              isField={isField}
              isAllowButtons={isAllowButtons}
            />
          )}
          {!isShow && !isOneToOne && (
            <IconButton
              size="small"
              onClick={() => setShow((isShow) => !isShow)}
              className={styles.iconButton}
            >
              <Tooltip title={translate("Add sub field")}>
                <MaterialIcon color="body" icon="arrow_forward" fontSize={18} />
              </Tooltip>
            </IconButton>
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
