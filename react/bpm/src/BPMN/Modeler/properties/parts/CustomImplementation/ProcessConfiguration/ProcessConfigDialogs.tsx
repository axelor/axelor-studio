import React from "react";
import { translate } from "@studio/shared/i18n";
import { AlertDialog } from "@studio/shared/components";

import { FieldEditor, Textbox } from "../../../../../../components/properties/components";
import { getMetaFields, fetchModels } from "../../../../../../shared/services";
import QueryBuilder from "../../../../../../components/QueryBuilder";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ProcessConfigDialogsProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openProcessPathDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenProcessDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openUserPathDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenUserPathDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openExpressionBuilder?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setExpressionBuilder?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openTranslationDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTranslationDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedProcessConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedProcessConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setField?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  script?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTranslations?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removedTranslations?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setRemovedTranslations?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processConfigs?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getter?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setter?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import styles from "./process-config.module.css";
import ProcessConfigTitleTranslation from "./ProcessConfigTitleTranslation";

export default function ProcessConfigDialogs({
  element,
  bpmnModeler,
  openProcessPathDialog,
  setOpenProcessDialog,
  openUserPathDialog,
  setOpenUserPathDialog,
  openExpressionBuilder,
  setExpressionBuilder,
  openScriptDialog,
  setOpenScriptDialog,
  openTranslationDialog,
  setTranslationDialog,
  selectedProcessConfig,
  setSelectedProcessConfig,
  startModel,
  field,
  setField,
  script,
  setScript,
  _translations,
  setTranslations,
  _removedTranslations,
  setRemovedTranslations,
  processConfigs,
  getter,
  setter,
  updateValue,
  onConfirm,
  getData,
  openDialog,
}: ProcessConfigDialogsProps) {
  const handleExpressionBuilder = () => setExpressionBuilder(false);

  return (
    <>
      <AlertDialog
        openAlert={openProcessPathDialog}
        title={"Process Path"}
        fullscreen={false}
        handleAlertOk={() => {
          if (
            field &&
            field.target !== (startModel && startModel.fullName) &&
            field.jsonTarget !== (startModel && startModel.name)
          ) {
            openDialog({
              message: "Last subfield should be related to start model",
              title: "Warning",
            });
            return;
          }
          setOpenProcessDialog(false);
          if (selectedProcessConfig) {
            updateValue(
              selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.processPath,
              "processPath",
              undefined,
              selectedProcessConfig.key,
            );
          }
        }}
        alertClose={() => setOpenProcessDialog(false)}
        children={
          <FieldEditor
            getMetaFields={() =>
              getMetaFields(getData(selectedProcessConfig && selectedProcessConfig.processConfig))
            }
            onChange={(val: any, field: any) => {
              setField(field);
              setSelectedProcessConfig({
                processConfig: {
                  ...((selectedProcessConfig && selectedProcessConfig.processConfig) || {}),
                  processPath: val,
                },
                key: selectedProcessConfig && selectedProcessConfig.key,
              });
            }}
            startModel={startModel}
            value={{
              fieldName:
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.processPath,
            }}
            isParent={true}
          />
        }
      />

      {openExpressionBuilder && (
        <QueryBuilder
          open={openExpressionBuilder}
          close={handleExpressionBuilder}
          title="Add expression"
          setProperty={setter}
          getExpression={getter}
          fetchModels={() => fetchModels(element, processConfigs)}
        />
      )}
      {openScriptDialog && (
        <AlertDialog
          className={styles.scriptDialog}
          openAlert={openScriptDialog}
          alertClose={() => setOpenScriptDialog(false)}
          handleAlertOk={() => {
            updateValue(
              script === "" ? undefined : script,
              "pathCondition",
              undefined,
              selectedProcessConfig?.key || 0,
            );
            setOpenScriptDialog(false);
          }}
          title={translate("Add expression")}
          children={
            <Textbox
              element={element}
              className={styles.textbox}
              showLabel={false}
              defaultHeight={window?.innerHeight - 205}
              entry={{
                id: "script",
                label: translate("Condition"),
                modelProperty: "script",
                get: function () {
                  return { script };
                },
                set: function (e: any, values: any) {
                  setScript(values?.script);
                },
              }}
            />
          }
        />
      )}

      <AlertDialog
        openAlert={openUserPathDialog}
        title={"User default Path"}
        fullscreen={false}
        handleAlertOk={() => {
          if (field && field.target !== "com.axelor.auth.db.User") {
            openDialog({ title: "Warning", message: "Last subfield should be related to user" });
            return;
          }
          setOpenUserPathDialog(false);
          if (selectedProcessConfig) {
            updateValue(
              selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.userDefaultPath,
              "userDefaultPath",
              undefined,
              selectedProcessConfig.key,
            );
          }
        }}
        children={
          <FieldEditor
            getMetaFields={() =>
              getMetaFields(getData(selectedProcessConfig && selectedProcessConfig.processConfig))
            }
            onChange={(val: any, field: any) => {
              setField(field);
              setSelectedProcessConfig({
                processConfig: {
                  ...((selectedProcessConfig && selectedProcessConfig.processConfig) || {}),
                  userDefaultPath: val,
                },
                key: selectedProcessConfig && selectedProcessConfig.key,
              });
            }}
            value={{
              fieldName:
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.userDefaultPath,
            }}
            isParent={true}
            isUserPath={true}
          />
        }
        alertClose={() => {
          setOpenUserPathDialog(false);
          setSelectedProcessConfig(null);
        }}
      />

      <AlertDialog
        openAlert={openTranslationDialog}
        title="Translations"
        fullscreen={false}
        handleAlertOk={onConfirm}
        alertClose={() => setTranslationDialog(false)}
        children={
          <div>
            <ProcessConfigTitleTranslation
              element={element}
              configKey={
                selectedProcessConfig &&
                selectedProcessConfig.processConfig &&
                selectedProcessConfig.processConfig.title
              }
              onChange={(translations: any, removedTranslations: any) => {
                setTranslations(translations);
                setRemovedTranslations(removedTranslations);
              }}
              bpmnModeler={bpmnModeler}
            />
          </div>
        }
      />
    </>
  );
}
