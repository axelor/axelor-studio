import React from "react";
import { translate } from "@studio/shared/i18n";
import { AlertDialog } from "@studio/shared/components";

import { FieldEditor, Textbox } from "../../../../../../components/properties/components";
import { fetchModels } from "../../../../../../shared/services";
import QueryBuilder from "../../../../../../components/QueryBuilder";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface FieldActionDialogsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  title?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isUserPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDatePath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isUserAction?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openAlertDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenAlertDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alertMessage?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAlertMessage?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openBuilder?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenBuilder?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dummyState?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDummyState?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setReadOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setField?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  path?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFields?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getterMethod?: any;
}
import styles from "./model-props.module.css";


export default function FieldActionDialogs({
  element,
  title,
  label,
  isUserPath,
  isDatePath,
  isUserAction,
  openAlertDialog,
  setOpenAlertDialog,
  alertMessage,
  setAlertMessage,
  openDialog,
  setOpenDialog,
  openScript,
  setOpenScript,
  openBuilder,
  setOpenBuilder,
  dummyState,
  setDummyState,
  readOnly,
  setReadOnly,
  field,
  setField,
  _path,
  setPath,
  currentType,
  getProperty,
  setProperty,
  getFields,
  updateScript,
  getterMethod,
}: FieldActionDialogsProps) {
  const toPath = (text: any) => `${text}Path`;
  const toPathValue = (text: any) => `${text}PathValue`;
  const toType = (text: any) => `${text}Type`;
  const toLowerCase = (text: any) => text.toLowerCase();

  return (
    <>
      <AlertDialog
        openAlert={openAlertDialog}
        message={alertMessage}
        title="Error"
        handleAlertOk={() => {
          if (currentType.value === "script") {
            setDummyState(getProperty(toPath(title)));
            setOpenScript(true);
          }

          setReadOnly(false);
          setOpenAlertDialog(false);
        }}
        alertClose={() => setOpenAlertDialog(false)}
      />
      <AlertDialog
        openAlert={openDialog}
        title={`${label} field path`}
        fullscreen={false}
        children={
          <div className={styles.dialogContent}>
            <FieldEditor
              getMetaFields={getFields}
              onChange={(val: any, field: any) => {
                setDummyState(val);
                setField(field);
              }}
              value={{ fieldName: dummyState || "" }}
              isParent={true}
              isUserPath={isUserPath}
              isDatePath={isDatePath}
            />
          </div>
        }
        handleAlertOk={() => {
          const alerts: Record<string, { condition: boolean; message: string }> = {
            userField: {
              condition: field?.target !== "com.axelor.auth.db.User",
              message: "Last sub field must be user field",
            },
            deadlineField: {
              condition: field?.type && !["datetime", "date"].includes(field.type.toLowerCase()),
              message: "Field should be date field",
            },
            teamField: {
              condition: field?.target !== "com.axelor.team.db.Team",
              message: "Last subfield should be related to team",
            },
            roleField: {
              condition: field?.target !== "com.axelor.auth.db.Role",
              message: "Last sub field must be role field",
            },
          };

          const alert = alerts[title as string];

          if (alert?.condition) {
            setAlertMessage(alert.message);
            setOpenAlertDialog(true);
            return;
          }
          setProperty(toPath(title), dummyState);
          setProperty(isUserAction ? toType(toLowerCase(label)) : toType(title), currentType.value);
          setPath(dummyState);
          setReadOnly(true);
          setOpenDialog(false);
        }}
        alertClose={() => {
          setOpenDialog(false);
        }}
      />

      <QueryBuilder
        open={openBuilder}
        close={() => setOpenBuilder(false)}
        type="bpmQuery"
        isCreateObject={false}
        title="Add query"
        setProperty={(val: any) => {
          const { expression, value, combinator, checked } = val;
          if (val) {
            setPath(expression);
            const pathValue = JSON.stringify({
              scriptOperatorType: combinator,
              checked,
              value: (value || "")?.replace(/[\u200B-\u200D\uFEFF]/g, undefined),
            });
            setDummyState(expression);
            setProperty(toPath(title), expression);
            setProperty(toPathValue(title), pathValue);
            setProperty(
              isUserAction ? toType(toLowerCase(label)) : toType(title),
              currentType.value,
            );
            setReadOnly(true);
          }
        }}
        getExpression={() => getterMethod(title)}
        fetchModels={() => fetchModels(element)}
      />
      <AlertDialog
        className={styles.scriptDialog}
        openAlert={openScript}
        alertClose={() => {
          setOpenScript(false);
          setDummyState(null);
        }}
        handleAlertOk={() => {
          updateScript();
          setOpenScript(false);
        }}
        title={translate("Add script")}
        children={
          <Textbox
            element={element}
            className={styles.textbox}
            readOnly={readOnly && getProperty(toPathValue(title))}
            showLabel={false}
            defaultHeight={window?.innerHeight - 205}
            entry={{
              id: "script",
              label: translate("Script"),
              modelProperty: "script",
              get: function () {
                return {
                  script: dummyState,
                };
              },
              set: function (e: any, values: any) {
                const updatedValue = values?.script;
                setDummyState(updatedValue);
              },
            }}
            suggestion={true}
          />
        }
      />
    </>
  );
}
