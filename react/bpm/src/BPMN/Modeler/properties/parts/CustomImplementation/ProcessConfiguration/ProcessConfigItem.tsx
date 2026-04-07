import React from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { IconButton, Tooltip } from "@studio/shared/components";

import Select from "../../../../../../components/Select";
import { TextField, Checkbox } from "../../../../../../components/properties/components";
import { getMetaModels, getCustomModels } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ProcessConfigItemProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configKey?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateStartModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeItem?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeElement?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processConfigList?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenProcessDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenUserPathDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSelectedProcessConfig?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setField?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPathCondition?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setExpressionBuilder?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setTranslationDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import styles from "./process-config.module.css";

export default function ProcessConfigItem({
  element,
  processConfig,
  configKey,
  updateValue,
  updateStartModel,
  removeItem,
  removeElement,
  startModel,
  processConfigList,
  setOpenProcessDialog,
  setOpenUserPathDialog,
  setSelectedProcessConfig,
  setField,
  setPathCondition,
  setScript,
  setOpenScriptDialog,
  setExpressionBuilder,
  setTranslationDialog,
  openDialog,
}: ProcessConfigItemProps) {
  return (
    <Box d="flex" alignItems="flex-start">
      <Box
        w={100}
        rounded={2}
        border
        bg="body-tertiary"
        color="body"
        style={{ marginTop: 5, marginBottom: 10 }}
      >
        <Box style={{ padding: 10 }}>
          <Box d="flex" className={styles.container}>
            <Box flex="1" justifyContent="flex-end" className={styles.grid}>
              <InputLabel color="body" className={styles.label}>
                {translate("Model")}
              </InputLabel>
              {(
                processConfig.isCustom === undefined
                  ? processConfig.metaJsonModel
                    ? false
                    : true
                  : !getBool(processConfig.isCustom)
              ) ? (
                <Select
                  fetchMethod={(criteria: any) => getMetaModels(criteria)}
                  update={(value: any, label: any) => {
                    updateValue(value, "metaModel", "name", configKey, label);
                  }}
                  name="metaModel"
                  optionLabel="name"
                  value={processConfig.metaModel || ""}
                  isLabel={false}
                />
              ) : (
                <Select
                  fetchMethod={(options: any) => getCustomModels(options)}
                  update={(value: any, label: any) => {
                    updateValue(value, "metaJsonModel", "name", configKey, label);
                  }}
                  name="metaJsonModel"
                  value={processConfig.metaJsonModel || ""}
                  isLabel={false}
                  optionLabel="name"
                />
              )}
            </Box>
          </Box>
          <Box d="flex" justifyContent="space-between" className={styles.container}>
            <Box className={styles.grid}>
              <Checkbox
                className={styles.checkbox}
                labelClassName={styles.checkboxLabel}
                entry={{
                  id: `custom-${configKey}`,
                  modelProperty: "isCustom",
                  label: translate("Custom"),
                  get: function () {
                    return {
                      isCustom:
                        processConfig.isCustom === undefined
                          ? processConfig.metaJsonModel
                            ? true
                            : false
                          : getBool(processConfig.isCustom),
                    };
                  },
                  set: function (e: any, values: any) {
                    updateValue(!values.isCustom, "isCustom", undefined, configKey);
                  },
                }}
                element={element}
              />
            </Box>
            <Box className={styles.grid}>
              <Checkbox
                className={styles.checkbox}
                labelClassName={styles.checkboxLabel}
                entry={{
                  id: `start-model-${configKey}`,
                  label: translate("Start model ?"),
                  modelProperty: "isStartModel",
                  get: function () {
                    return { isStartModel: getBool(processConfig.isStartModel) };
                  },
                  set: function (e: any, values: any) {
                    updateValue(!values.isStartModel, "isStartModel", undefined, configKey);
                    if (!values.isStartModel) {
                      updateStartModel(processConfig);
                    }
                  },
                }}
                element={element}
              />
            </Box>
            <Box className={styles.grid}>
              <Checkbox
                className={styles.checkbox}
                labelClassName={styles.checkboxLabel}
                entry={{
                  id: `direct-creation-${configKey}`,
                  modelProperty: "isDirectCreation",
                  label: translate("Direct creation ?"),
                  get: function () {
                    return { isDirectCreation: getBool(processConfig.isDirectCreation) };
                  },
                  set: function (e: any, values: any) {
                    updateValue(!values.isDirectCreation, "isDirectCreation", undefined, configKey);
                  },
                }}
                element={element}
              />
            </Box>
          </Box>
          <Box d="flex" className={styles.container}>
            <Box style={{ width: "50%" }} className={styles.grid}>
              <InputLabel color="body" className={styles.label}>
                {translate("Title")}
              </InputLabel>
              <TextField
                element={element}
                canRemove={getBool(processConfig.isTranslations) ? false : true}
                rootClass={styles.textFieldRoot}
                labelClass={styles.textFieldLabel}
                clearClassName={styles.clearClassName}
                disabled={getBool(processConfig.isTranslations)}
                readOnly={getBool(processConfig.isTranslations)}
                entry={{
                  id: `title_${configKey}`,
                  name: "title",
                  modelProperty: "title",
                  get: function () {
                    return { title: processConfig.title };
                  },
                  set: function (e: any, value: any) {
                    if (value.title !== processConfig.title) {
                      updateValue(
                        value.title === "" ? undefined : value.title,
                        "title",
                        undefined,
                        configKey,
                      );
                    }
                  },
                }}
                endAdornment={
                  <MaterialIcon
                    fontSize={18}
                    icon="edit"
                    className={styles.newIcon}
                    onClick={() => {
                      setTranslationDialog(true);
                      setSelectedProcessConfig({ processConfig, key: configKey });
                    }}
                  />
                }
              />
            </Box>
            <Box style={{ width: "50%" }} className={styles.grid}>
              <InputLabel color="body" className={styles.label}>
                {translate("Process path")}
              </InputLabel>
              <TextField
                element={element}
                canRemove={true}
                rootClass={styles.textFieldRoot}
                labelClass={styles.textFieldLabel}
                clearClassName={styles.clearClassName}
                disabled={getBool(processConfig.isStartModel)}
                entry={{
                  id: `processPath_${configKey}`,
                  name: "processPath",
                  modelProperty: "processPath",
                  get: function () {
                    return { processPath: processConfig.processPath };
                  },
                  set: function (e: any, value: any) {
                    if (value.processPath !== processConfig.processPath) {
                      updateValue(
                        value.processPath === "" ? undefined : value.processPath,
                        "processPath",
                        undefined,
                        configKey,
                      );
                    }
                  },
                }}
                endAdornment={
                  <>
                    {!getBool(processConfig.isStartModel) && (
                      <MaterialIcon
                        icon="edit"
                        fontSize={18}
                        className={styles.newIcon}
                        onClick={() => {
                          setOpenProcessDialog(true);
                          setSelectedProcessConfig({ processConfig, key: configKey });
                          setField(null);
                          if (!startModel) {
                            const model =
                              processConfigList &&
                              processConfigList.find((f: any) => getBool(f.isStartModel));
                            updateStartModel(model);
                          }
                        }}
                      />
                    )}
                  </>
                }
              />
            </Box>
          </Box>
          <Box d="flex" className={styles.container}>
            <Box style={{ width: "50%" }} className={styles.grid}>
              <InputLabel color="body" className={styles.label}>
                {translate("Condition")}
              </InputLabel>
              <TextField
                element={element}
                canRemove={true}
                rootClass={styles.textFieldRoot}
                labelClass={styles.textFieldLabel}
                clearClassName={styles.clearClassName}
                readOnly={processConfig && processConfig.pathConditionValue ? true : false}
                entry={{
                  id: `pathCondition_${configKey}`,
                  name: "pathCondition",
                  modelProperty: "pathCondition",
                  get: function () {
                    return { pathCondition: processConfig.pathCondition || "" };
                  },
                  set: function (e: any, values: any) {
                    if (values.pathCondition !== processConfig.pathCondition) {
                      updateValue(
                        values.pathCondition === "" ? undefined : values.pathCondition,
                        "pathCondition",
                        undefined,
                        configKey,
                      );
                    }
                  },
                }}
                endAdornment={
                  <>
                    <Tooltip title={translate("Enable")} aria-label="enable">
                      <BootstrapIcon
                        icon="code-slash"
                        fontSize={18}
                        onClick={() => {
                          setPathCondition({ key: configKey, processConfig });
                          if (processConfig && processConfig.pathConditionValue) {
                            openDialog({
                              title: "Warning",
                              message:
                                "Path condition can't be managed using builder once changed manually.",
                              onSave: () => {
                                updateValue(
                                  processConfig?.pathCondition,
                                  "pathCondition",
                                  undefined,
                                  configKey,
                                  undefined,
                                );
                                setScript(processConfig?.pathCondition);
                                setOpenScriptDialog(true);
                              },
                            });
                          } else {
                            setScript(processConfig?.pathCondition);
                            setOpenScriptDialog(true);
                          }
                        }}
                      />
                    </Tooltip>
                    <MaterialIcon
                      icon="edit"
                      fontSize={18}
                      className={styles.newIcon}
                      onClick={() => {
                        setSelectedProcessConfig({ processConfig, key: configKey });
                        setExpressionBuilder(true);
                      }}
                    />
                  </>
                }
              />
            </Box>
            <Box style={{ width: "50%" }} className={styles.grid}>
              <InputLabel color="body" className={styles.label}>
                {translate("User default path")}
              </InputLabel>
              <TextField
                element={element}
                canRemove={true}
                rootClass={styles.textFieldRoot}
                labelClass={styles.textFieldLabel}
                clearClassName={styles.clearClassName}
                entry={{
                  id: `userDefaultPath_${configKey}`,
                  name: "userDefaultPath",
                  modelProperty: "userDefaultPath",
                  get: function () {
                    return { userDefaultPath: processConfig.userDefaultPath };
                  },
                  set: function (e: any, value: any) {
                    updateValue(value.userDefaultPath, "userDefaultPath", undefined, configKey);
                  },
                }}
                endAdornment={
                  <MaterialIcon
                    icon="edit"
                    fontSize={18}
                    className={styles.newIcon}
                    onClick={() => {
                      setOpenUserPathDialog(true);
                      setField(null);
                      setSelectedProcessConfig({ processConfig, key: configKey });
                    }}
                  />
                }
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box color="body" style={{ textAlign: "center" }} className={styles.Grid}>
        <IconButton
          className={styles.iconButton}
          onClick={() => {
            removeItem(configKey);
            removeElement(configKey);
          }}
        >
          <MaterialIcon icon="close" fontSize={14} />
        </IconButton>
      </Box>
    </Box>
  );
}
