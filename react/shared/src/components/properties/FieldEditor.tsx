import React, { useEffect, useState } from "react";
import { clsx } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import IconButton from "../IconButton";
import { translate } from "../../i18n/index";
import { Selection } from "../Selection";
import { getSubMetaField } from "../../services/meta-field-service";
import { UI_TYPES } from "../../utils/constants";
import { Tooltip } from "../Tooltip";


import styles from "./field-editor.module.css";

interface MetaField {
  name: string;
  type: string;
  target?: string;
  jsonTarget?: string;
  jsonField?: boolean;
  fullName?: string;
}

interface FieldValue {
  fieldName?: string | Record<string, string>;
  allFields?: MetaField[] | null;
}

interface StartModel {
  fullName?: string;
  name?: string;
}

interface FieldEditorProps {
  initValue?: string;
  getMetaFields: () => Promise<MetaField[]>;
  onChange: (
    fieldName: string | undefined,
    value: MetaField | null,
    relationalField?: MetaField | null,
  ) => void;
  value: FieldValue;
  classNames?: string;
  isParent?: boolean;
  isUserPath?: boolean;
  startModel?: StartModel;
  isCollection?: boolean;
  allowAllFields?: boolean;
  excludeUITypes?: boolean;
  isDatePath?: boolean;
  fieldType?: string;
}

export default function FieldEditor({
  initValue = "",
  getMetaFields,
  onChange,
  value,
  classNames,
  isParent = false,
  isUserPath = false,
  startModel,
  isCollection = false,
  allowAllFields = false,
  excludeUITypes = false,
  isDatePath = false,
  fieldType,
}: FieldEditorProps) {
  const { fieldName = "", allFields } = value || {};
  const [fields, setFields] = useState<MetaField[]>([]);
  const [isShow, setShow] = useState(true);
  const [isButton, setButton] = useState(true);
  const [allFieldValues, setAllFieldValues] = useState<MetaField[] | null>(null);

  let values: string[] | null = null;
  if (typeof fieldName === "object" && fieldName) {
    values = fieldType ? (fieldName[fieldType]?.split(".") ?? null) : null;
  } else if (typeof fieldName === "string") {
    values = fieldName?.split(".");
  }

  const [startValue] = values || [];
  const hasManyValues =
    fieldName && isParent && fields && fields.some((x) => x.name === startValue);
  const relationModel =
    hasManyValues && (fields.find((x) => x.name === startValue) || ({} as MetaField)).target;
  const relationJsonModel =
    (hasManyValues &&
      (fields.find((x) => x.name === startValue) || ({} as MetaField)).jsonTarget) ||
    null;

  function handleChange(value: MetaField | null) {
    const _isRelationalField = value && fields.some((x) => x.name === value.name && x.target);
    // NOTE: Original code had a dead ternary branch (`"" ? ... : ...` is always falsy).
    // Preserved runtime behavior: isParent => prefixed, else value?.name ?? ""
    let newFieldName: string;
    if (isParent) {
      newFieldName = `${initValue}${value ? value.name : ""}`;
    } else if (value) {
      newFieldName = value.name;
    } else {
      // The original dead branch used `isRelationalField` prefix but was unreachable.
      // Keeping the effective behavior: empty string when no value.
      newFieldName = "";
    }
    newFieldName = value && value.name ? newFieldName : newFieldName.slice(0, -1);

    const relationalField =
      allFieldValues && [...(allFieldValues || []), value].reverse().find((x) => x && x.target);
    onChange(
      newFieldName === "" ? undefined : newFieldName,
      value,
      relationalField as MetaField | null,
    );
  }
  const transformValue = fields && fields.find((f) => f.name === startValue);

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      const data = await getMetaFields();
      if (isSubscribed) {
        setFields(
          data?.filter((d: MetaField) =>
            excludeUITypes
              ? !UI_TYPES.includes(d.type && d.type.toLowerCase())
              : isCollection
                ? ["many_to_one", "one_to_many", "many_to_many"].includes(d.type.toLowerCase())
                : allowAllFields
                  ? isDatePath
                    ? ["date", "datetime"].includes(d.type.toLowerCase())
                    : true
                  : isDatePath
                    ? ["date", "datetime", "many_to_one", "many-to-one"].includes(
                        d.type.toLowerCase(),
                      )
                    : ["many_to_one", "many-to-one"].includes(d.type.toLowerCase()),
          ),
        );
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [getMetaFields, isCollection, allowAllFields, excludeUITypes, isDatePath]);

  useEffect(() => {
    let currentValues: string[] | null = null;
    if (typeof fieldName === "object" && fieldName) {
      currentValues = fieldType ? (fieldName[fieldType]?.split(".") ?? null) : null;
    } else if (typeof fieldName === "string") {
      currentValues = fieldName?.split(".");
    }

    const transformValue =
      fields && fields.find((f) => f.name === (currentValues && currentValues[0]));

    const lastValue =
      currentValues && currentValues.length > 0
        ? currentValues[currentValues.length - 1]
        : undefined;

    if (
      isUserPath &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      (currentValues?.length ?? 0) === 1
    ) {
      if (transformValue.target === "com.axelor.auth.db.User") {
        setShow(false);
      } else {
        setShow(true);
      }
    } else if (
      isCollection &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      (currentValues?.length ?? 0) === 1
    ) {
      if (["MANY_TO_MANY", "ONE_TO_MANY"].includes(transformValue.type)) {
        setShow(false);
        setButton(false);
      } else {
        setShow(true);
      }
    } else if (isDatePath && transformValue) {
      if (["datetime", "date"].includes(transformValue.type && transformValue.type.toLowerCase())) {
        setShow(false);
        setButton(false);
      } else {
        setShow(true);
      }
    } else if (
      startModel &&
      transformValue &&
      lastValue &&
      transformValue.name === lastValue &&
      (startModel.fullName === transformValue.target ||
        startModel.name === transformValue.jsonTarget) &&
      (currentValues?.length ?? 0) === 1
    ) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [isUserPath, startModel, fields, isCollection, isDatePath, fieldName, fieldType]);

  useEffect(() => {
    setAllFieldValues(allFields ?? null);
  }, [allFields]);

  return (
    <React.Fragment>
      <Selection
        name="fieldName"
        title={translate("Field name")}
        placeholder={translate("Field name")}
        options={fields}
        optionLabelKey="name"
        onChange={(value: MetaField | null) => handleChange(value)}
        value={transformValue}
        classes={clsx(styles.MuiAutocompleteRoot, classNames)}
      />
      {hasManyValues &&
        relationModel &&
        (isUserPath
          ? transformValue &&
            transformValue.target !== "com.axelor.meta.db.MetaJsonRecord" &&
            !transformValue.jsonField
          : true) && (
          <React.Fragment>
            {isShow && (
              <IconButton
                size="small"
                onClick={() => {
                  setShow((isShow) => !isShow);
                  if (fields && fields.length > 0 && startValue) {
                    const previousField = fields.find((f) => f.name === startValue);
                    handleChange({
                      ...(previousField || ({} as MetaField)),
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
            {isShow && (
              <FieldEditor
                getMetaFields={() =>
                  getSubMetaField(
                    relationModel,
                    relationJsonModel,
                    isCollection,
                    allowAllFields,
                    excludeUITypes,
                    isDatePath,
                  )
                }
                initValue={`${initValue}${startValue}${"."}`}
                value={{
                  fieldName: (values ?? []).slice(1).join("."),
                  allFields,
                }}
                onChange={onChange}
                classNames={classNames}
                isParent={relationModel ? true : false}
                isUserPath={isUserPath}
                isDatePath={isDatePath}
                startModel={startModel}
                isCollection={isCollection}
                allowAllFields={allowAllFields}
                excludeUITypes={excludeUITypes}
              />
            )}
            {!isShow && isButton && (
              <IconButton
                size="small"
                onClick={() => setShow((isShow) => !isShow)}
                className={styles.iconButton}
              >
                <Tooltip title={translate("Add sub field")}>
                  <MaterialIcon icon="arrow_forward" color="body" fontSize={18} />
                </Tooltip>
              </IconButton>
            )}
          </React.Fragment>
        )}
    </React.Fragment>
  );
}
