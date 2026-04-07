import React, { useCallback, useEffect, useState } from "react";
import { translate } from "@studio/shared/i18n";
import { Box, InputLabel, TableCell, TableRow } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Tooltip } from "@studio/shared/components";

import Select from "../../../../../../components/Select";
import { TextField } from "../../../../../../components/properties/components";
import { getMetaFields } from "../../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface FieldActionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  title?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaJsonModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isUserPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDatePath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isUserAction?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchMethod?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldTypes?: any;
}
import styles from "./model-props.module.css";
import FieldActionDialogs from "./FieldActionDialogs";

export function FieldAction({
  initialType,
  label,
  title,
  element,
  getProperty,
  setProperty,
  metaModel,
  metaJsonModel,
  isUserPath,
  isDatePath,
  isUserAction = false,
  fetchMethod,
  fieldTypes = ["field", "script"],
}: FieldActionProps) {
  const [currentType, setCurrentType] = useState({
    title: translate("Field"),
    value: "field",
  });
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [openBuilder, setOpenBuilder] = useState(false);
  const [alertMessage, setAlertMessage] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openScript, setOpenScript] = useState(false);
  const [dummyState, setDummyState] = useState<any>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [path, setPath] = useState<any>(null);
  const [model, setModel] = useState<any>(null);
  const [field, setField] = useState<any>(null);
  const TYPES = [
    { value: "value", title: translate("Value") },
    { value: "field", title: translate("Field") },
    { value: "script", title: translate("Script") },
  ];

  const toPath = (text: any) => `${text}Path`;
  const toPathValue = (text: any) => `${text}PathValue`;
  const toType = (text: any) => `${text}Type`;
  const toTask = (text: any) => `task${text}`;
  const toLowerCase = (text: any) => text.toLowerCase();

  useEffect(() => {
    const selectedType = TYPES.find((type: any) => type.value === initialType);
    if (selectedType) setCurrentType(selectedType);
  }, []);

  const getFields = useCallback(() => {
    return getMetaFields(model);
  }, [model]);

  const getSelectValue = React.useCallback(
    (name: any, element: any) => {
      const label = getProperty(`${name}Label`, element);
      const fullName = getProperty(`${name}ModelName`);
      const newName = getProperty(name, element);
      if (newName) {
        const value = { name: newName };
        if (label) {
          // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
          value.title = label;
        }
        if (fullName) {
          // @ts-expect-error -- safety: bpmn-js dynamic moddle property not in typed interface
          value.fullName = fullName;
        }
        return value;
      } else {
        return null;
      }
    },
    [getProperty],
  );

  useEffect(() => {
    if (metaModel) {
      setModel({ ...metaModel, type: "metaModel" });
    } else if (metaJsonModel) {
      setModel({ ...metaJsonModel, type: "metaJsonModel" });
    }
  }, [metaModel, metaJsonModel]);

  const clearPropertises = () => {
    setDummyState(null);
    setPath(null);
    setProperty(toPath(title), undefined);
    setProperty(toPathValue(title), undefined);
    setProperty(isUserAction ? toType(toLowerCase(label)) : toType(title), undefined);
    setProperty(toTask(label), undefined);
  };

  const updateScript = () => {
    if (!dummyState) {
      setPath(undefined);
      setProperty(toPath(title), undefined);
      setProperty(isUserAction ? toType(toLowerCase(label)) : toType(title), undefined);
      setProperty(toPathValue(title), undefined);
      return;
    }

    setPath(dummyState);
    setProperty(toPath(title), dummyState);
    setProperty(isUserAction ? toType(toLowerCase(label)) : toType(title), currentType.value);
    setProperty(toPathValue(title), undefined);
    setDummyState(null);
  };

  useEffect(() => {
    const fieldType = getProperty(isUserAction ? toType(toLowerCase(label)) : toType(title));
    const fieldPath = getProperty(fieldType === "value" ? toTask(label) : toPath(title));
    setPath(fieldPath);
    if (fieldType) {
      const matchedType = TYPES.find((item: any) => item.value === fieldType);
      if (matchedType) setCurrentType(matchedType);
    }

    fieldPath && setReadOnly(true);
    setDummyState(fieldPath);
  }, [getProperty, getSelectValue, element]);

  const getterMethod = (field: any) => {
    const fieldPathValue = getProperty(toPathValue(field));
    let values: any;
    if (!fieldPathValue) return { checked: true };
    const json = JSON.parse(fieldPathValue || "{}");
    const { value, scriptOperatorType } = json;
    values = JSON.parse(value || "{}");
    if (!values.length) {
      values = null;
    }
    return { values, combinator: scriptOperatorType, checked: true };
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <InputLabel className={styles.label}>{label}</InputLabel>
        </TableCell>
        <TableCell className={styles.tableCell}>
          <Select
            className={styles.select}
            value={currentType.title}
            type="text"
            options={TYPES.filter((type) => fieldTypes.includes(type.value))}
            update={(value: any, _label: any) => {
              setCurrentType(value);
              clearPropertises();
            }}
            // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
            disableClearable="false"
            optionLabel={"title"}
            isLabel={false}
          />
        </TableCell>
        <TableCell>
          {currentType.value === "value" ? (
            <Select
              name={title}
              fetchMethod={fetchMethod}
              value={path}
              update={(value: any) => {
                setProperty(toTask(label), value?.name);
                setProperty(toType(toLowerCase(label)), currentType.value);
                setPath(value?.name);
              }}
              isLabel={false}
              optionLabel={"name"}
            />
          ) : (
            <TextField
              className={styles.textbox}
              element={element}
              type="text"
              readOnly={readOnly && getProperty(toPathValue(title))}
              placeholder={label}
              entry={{
                id: "fieldPath",
                name: "fieldPath",
                modelProperty: "fieldPath",
                get: function () {
                  return { fieldPath: path };
                },
                set: function (e: any, value: any) {
                  if (!value.fieldPath) return;
                  setPath(value?.fieldPath);
                  setDummyState({ fieldPath: value?.fieldPath });
                  setProperty(toPath(title), value.fieldPath);
                  setProperty(
                    isUserAction ? toType(toLowerCase(label)) : toType(title),
                    value?.fieldPath !== "" && currentType.value,
                  );
                },
              }}
              canRemove={true}
              clearPropertises={clearPropertises}
            />
          )}
        </TableCell>
        <TableCell className={styles.tableCell}>
          {currentType.value === "field" && (
            <MaterialIcon
              fontSize={16}
              icon="edit"
              className={styles.newIcon}
              onClick={() => setOpenDialog(true)}
            />
          )}
          {currentType.value === "script" && (
            <Box className={styles.iconGroup}>
              <Tooltip title={translate("Script")} aria-label="enable">
                <div
                  style={{ fontSize: 18, marginLeft: 5 }}
                  onClick={() => {
                    if (readOnly && getProperty(toPathValue(title))) {
                      setAlertMessage(
                        `${label} field can't be managed using builder once changed manually.`,
                      );
                      setOpenAlertDialog(true);
                    } else {
                      setDummyState(getProperty(toPath(title)));
                      setOpenScript(true);
                    }
                  }}
                >
                  <MaterialIcon icon="code" />
                </div>
              </Tooltip>
              {!(title === "deadlineField") && (
                <MaterialIcon
                  fontSize={18}
                  icon="edit"
                  className={styles.newIcon}
                  onClick={() => setOpenBuilder(true)}
                />
              )}
            </Box>
          )}
        </TableCell>
      </TableRow>

      <FieldActionDialogs
        element={element}
        title={title}
        label={label}
        isUserPath={isUserPath}
        isDatePath={isDatePath}
        isUserAction={isUserAction}
        openAlertDialog={openAlertDialog}
        setOpenAlertDialog={setOpenAlertDialog}
        alertMessage={alertMessage}
        setAlertMessage={setAlertMessage}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        openScript={openScript}
        setOpenScript={setOpenScript}
        openBuilder={openBuilder}
        setOpenBuilder={setOpenBuilder}
        dummyState={dummyState}
        setDummyState={setDummyState}
        readOnly={readOnly}
        setReadOnly={setReadOnly}
        field={field}
        setField={setField}
        path={path}
        setPath={setPath}
        currentType={currentType}
        getProperty={getProperty}
        setProperty={setProperty}
        getFields={getFields}
        updateScript={updateScript}
        getterMethod={getterMethod}
      />
    </>
  );
}
