import React from "react";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { Box, Divider, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import QueryBuilder from "../../../../../../components/QueryBuilder";
import Select from "../../../../../../components/Select";
import {
  FieldEditor,
  TextField,
  Textbox,
} from "../../../../../../components/properties/components";
import {
  fetchModels,
  getCustomModels,
  getMetaFields,
  getMetaModels,
} from "../../../../../../shared/services";
import { getBool, getLowerCase } from "../../../../../../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface CallLinkSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setReadOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setParentPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentPathDummy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setParentPathDummy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openParentPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenParentPath?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openCondition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenCondition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  script?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSelectValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateCallActivitiyFields?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCallLinkCondition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import styles from "./callactivity.module.css";

export default function CallLinkSection({
  element,
  model,
  setModel,
  custom,
  readOnly,
  setReadOnly,
  parentPath,
  setParentPath,
  parentPathDummy,
  setParentPathDummy,
  openParentPath,
  setOpenParentPath,
  openCondition,
  setOpenCondition,
  openScriptDialog,
  setOpenScriptDialog,
  script,
  setScript,
  getProperty,
  setProperty,
  updateSelectValue,
  updateCallActivitiyFields,
  getCallLinkCondition,
  openDialog,
}: CallLinkSectionProps) {
  const getter = () => {
    const value = getProperty("conditionValue");
    const combinator = getProperty("conditionCombinator");
    const checked = getBool(getProperty("checked"));

    let values: any;
    if (value !== undefined) {
      try {
        values = JSON.parse(value);
      } catch (_errror) {}
    }
    return { values: values, combinator, checked };
  };

  const setter = (val: any) => {
    const { expression, value, combinator, checked } = val;
    setProperty("condition", expression);
    if (value === "" || value === null || value === undefined) {
      setProperty("conditionValue", value);
    }
    if (value) {
      setProperty("conditionValue", value);
      setReadOnly(true);
    }
    if (combinator) {
      setProperty("conditionCombinator", combinator);
    }
    setProperty("checked", checked);
  };

  const handleCloseCondition = () => {
    setOpenCondition(false);
  };

  return (
    <React.Fragment>
      <InputLabel color="body" className={styles.label}>
        {translate("Call model")}
      </InputLabel>
      {custom ? (
        <Select
          className={`${styles.select} ${styles.metajsonModel}`}
          fetchMethod={(options: any) => getCustomModels(options)}
          update={(value: any, label: any) => {
            setModel(value ? { ...(value || {}), type: "metaJsonModel" } : undefined);
            updateCallActivitiyFields();
            updateSelectValue("model", value, label);
          }}
          name="model"
          value={model}
          placeholder={translate("Call model")}
          isLabel={false}
          optionLabel="name"
        />
      ) : (
        <Select
          className={styles.select}
          fetchMethod={(options: any) => getMetaModels(options)}
          update={(value: any, label: any) => {
            const val = value ? { ...(value || {}), type: "metaModel" } : undefined;
            setModel(val);
            updateCallActivitiyFields();
            updateSelectValue("model", value, label);
          }}
          name="model"
          value={model}
          isLabel={false}
          placeholder={translate("Call model")}
          optionLabel="name"
        />
      )}
      <React.Fragment>
        <InputLabel color="body" className={styles.label}>
          {translate("Call link")}
        </InputLabel>
        <TextField
          element={element}
          canRemove={true}
          rootClass={styles.textFieldRoot}
          labelClass={styles.textFieldLabel}
          clearClassName={styles.clearClassName}
          readOnly={model ? false : true}
          entry={{
            id: `parentPath`,
            name: "parentPath",
            modelProperty: "parentPath",
            get: function () {
              return {
                parentPath: parentPath,
              };
            },
            set: function (e: any, value: any) {
              setParentPath(value.parentPath);
              setProperty("parentPath", value.parentPath);
            },
          }}
          endAdornment={
            <>
              {model && (
                <Box color="body" className={styles.new}>
                  <MaterialIcon
                    icon="edit"
                    fontSize={16}
                    className={styles.newIcon}
                    onClick={() => {
                      setOpenParentPath(true);
                    }}
                  />
                </Box>
              )}
            </>
          }
        />
        <AlertDialog
          className={styles.parentPathDialog}
          openAlert={openParentPath}
          centered={false}
          fullscreen={false}
          title={translate("Parent path")}
          handleAlertOk={() => {
            setOpenParentPath(false);
            setParentPath(parentPathDummy);
            setProperty("parentPath", parentPathDummy);
          }}
          alertClose={() => setOpenParentPath(false)}
          children={
            <FieldEditor
              getMetaFields={() => getMetaFields(model)}
              onChange={(val: any, _field: any) => {
                setParentPathDummy(val);
              }}
              value={{
                fieldName: parentPathDummy,
              }}
              isParent={true}
              allowAllFields={true}
            />
          }
        />

        <TextField
          element={element}
          readOnly={!readOnly && model ? false : true}
          entry={{
            id: "condition",
            label: translate("Call link condition"),
            modelProperty: "condition",
            get: function () {
              return getCallLinkCondition();
            },
            set: function (e: any, values: any) {
              const oldVal = getProperty("condition");
              const currentVal = values["condition"];
              (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
              setProperty("condition", currentVal);
              if (getLowerCase(oldVal) !== getLowerCase(currentVal)) {
                setProperty("conditionValue", undefined);
                setProperty("conditionCombinator", undefined);
              }
            },
          }}
          canRemove={true}
          endAdornment={
            <>
              {model && (
                <Box color="body" className={styles.new}>
                  <Tooltip title={translate("Enable")} aria-label="enable">
                    <BootstrapIcon
                      icon="code-slash"
                      fontSize={18}
                      onClick={() => {
                        if (readOnly) {
                          openDialog({
                            title: "Warning",
                            message:
                              "Link condition can't be managed using builder once changed manually.",
                            onSave: () => {
                              setReadOnly(false);
                              setScript(getCallLinkCondition()?.condition);
                              setProperty("conditionValue", undefined);
                              setProperty("conditionCombinator", undefined);
                              setOpenScriptDialog(true);
                            },
                          });
                        } else {
                          setScript(getCallLinkCondition()?.condition);
                          setOpenScriptDialog(true);
                        }
                      }}
                    />
                  </Tooltip>
                  <MaterialIcon
                    icon="edit"
                    fontSize={16}
                    className={styles.newIcon}
                    onClick={() => setOpenCondition(true)}
                  />
                  {openCondition && (
                    <QueryBuilder
                      open={setOpenCondition}
                      close={handleCloseCondition}
                      title="Add expression"
                      setProperty={setter}
                      getExpression={getter}
                      defaultModel={model}
                      fetchModels={() => fetchModels(element)}
                    />
                  )}
                </Box>
              )}
            </>
          }
        />
        <Divider className={styles.divider} />
      </React.Fragment>
      <AlertDialog
        className={styles.scriptDialog}
        openAlert={openScriptDialog}
        alertClose={() => {
          setScript(getCallLinkCondition()?.condition);
          setOpenScriptDialog(false);
        }}
        handleAlertOk={() => {
          setProperty("condition", (script || "").replace(/[\u200B-\u200D\uFEFF]/g, ""));
          setOpenScriptDialog(false);
        }}
        title={translate("Call link condition")}
        children={
          <Textbox
            element={element}
            className={styles.textbox}
            showLabel={false}
            defaultHeight={window?.innerHeight - 205}
            entry={{
              id: "script",
              label: translate("Call link condition"),
              modelProperty: "condition",
              get: function () {
                return { condition: script };
              },
              set: function (e: any, values: any) {
                setScript(values?.condition);
              },
            }}
          />
        }
      />
    </React.Fragment>
  );
}
