import React from "react";
import { translate } from "@studio/shared/i18n";
import { InputLabel, TableRow, TableCell } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Tooltip } from "@studio/shared/components";

import { TextField } from "../../../../../../components/properties/components";
import Select from "../../../../../../components/Select";

import styles from "./menu-action.module.css";
import { PRIORITIES } from "./constants";

export function NameRow(props: any) {
  const {
    element,
    selectedTaskOption,
    setSelectedTaskOption,
    taskFields,
    setActionDummy,
    setFieldTypes,
    setProperty,
    getProperty,
    handleChange,
    getScript,
    filterTypes,
    setOpenScriptDialog,
  } = props;
  return (
    <TableRow>
      <TableCell>
        <InputLabel className={styles.label}>{translate("Name")}</InputLabel>
      </TableCell>
      <TableCell>
        <Select
          className={styles.select}
          type="text"
          value={selectedTaskOption.taskNameType || null}
          options={filterTypes("field")}
          update={(value: any) => {
            setSelectedTaskOption((prevState: any) => ({
              ...prevState,
              taskNameType: value?.title,
            }));
            const taskNameTypes = ["Value", "Script"];
            if (
              taskNameTypes.includes(selectedTaskOption.taskNameType) ||
              taskNameTypes.includes(getProperty("taskNameType"))
            ) {
              handleChange("taskName", null);
              setProperty("taskName", undefined);
              setProperty("taskNameType", undefined);
              setActionDummy((prev: any) => ({ ...prev, taskName: null }));
            }
          }}
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          disableClearable="false"
          isLabel={false}
          optionLabel={"title"}
        />
      </TableCell>
      <TableCell>
        <TextField
          className={styles.textbox}
          element={element}
          type="text"
          canRemove={true}
          entry={{
            id: "taskName",
            name: "taskName",
            modelProperty: "taskName",
            get: function () {
              return { taskName: taskFields.taskName || "" };
            },
            set: function (e: any, value: any) {
              handleChange("taskName", value.taskName);
              setProperty("taskName", value.taskName);
              setProperty(
                "taskNameType",
                value?.taskName !== "" ? selectedTaskOption?.taskNameType : undefined,
              );
              setActionDummy((prev: any) => ({
                ...prev,
                taskName: value.taskName,
              }));
            },
            validate: function (e, values) {
              true;
              if (!values.taskName) {
                return { taskName: translate("Must provide a value") };
              }
            },
          }}
        />
      </TableCell>
      <TableCell className={styles.tableCell}>
        {selectedTaskOption.taskNameType === "Script" && (
          <Tooltip title={translate("Script")} aria-label="enable">
            <div
              style={{ cursor: "pointer" }}
              onClick={() => {
                setFieldTypes("taskName");
                setActionDummy((prev: any) => ({
                  ...prev,
                  taskName: getScript("taskName"),
                }));
                setOpenScriptDialog(true);
              }}
            >
              <MaterialIcon icon="code" fontSize={20} />
            </div>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

export function PriorityRow(props: any) {
  const {
    element,
    selectedTaskOption,
    setSelectedTaskOption,
    taskFields,
    setActionDummy,
    setFieldTypes,
    setProperty,
    getProperty,
    handleChange,
    getScript,
    filterTypes,
    setOpenScriptDialog,
  } = props;
  return (
    <TableRow>
      <TableCell>
        <InputLabel className={styles.label}>{translate("Priority")}</InputLabel>
      </TableCell>
      <TableCell>
        <Select
          className={styles.select}
          value={selectedTaskOption.priorityType || null}
          type="text"
          options={filterTypes("field")}
          update={(value: any, _label: any) => {
            setSelectedTaskOption((prevState: any) => ({
              ...prevState,
              priorityType: value?.title,
            }));
            const priorityTypes = ["Value", "Field", "Script"];
            if (
              priorityTypes.includes(selectedTaskOption.priorityType) ||
              priorityTypes.includes(getProperty("priorityType"))
            ) {
              handleChange("taskPriority", null);
              setProperty("taskPriority", undefined);
              setProperty("priorityType", undefined);
              setActionDummy((prev: any) => ({ ...prev, taskPriority: null }));
            }
          }}
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          disableClearable="false"
          isLabel={false}
          optionLabel={"title"}
        />
      </TableCell>
      <TableCell>
        {selectedTaskOption.priorityType === "Value" ? (
          <div className={styles.fieldsContainer}>
            <Select
              className={styles.select}
              name="taskPriority"
              options={PRIORITIES}
              value={taskFields.taskPriority || null}
              update={(value: any, _label: any) => {
                handleChange("taskPriority", value?.title);
                setProperty("taskPriority", value?.value);
                setProperty("priorityType", value?.value && selectedTaskOption?.priorityType);
              }}
              isLabel={false}
              optionLabel={"title"}
            />
          </div>
        ) : (
          <TextField
            className={styles.textbox}
            element={element}
            type="text"
            canRemove={true}
            entry={{
              id: "taskPriority",
              name: "taskPriority",
              modelProperty: "taskPriority",
              get: function () {
                return { taskPriority: taskFields.taskPriority || "" };
              },
              set: function (e: any, value: any) {
                handleChange("taskPriority", value.taskPriority);
                setProperty("taskPriority", value.taskPriority);
                setProperty(
                  "priorityType",
                  value.taskPriority !== "" ? selectedTaskOption?.priorityType : undefined,
                );
                setActionDummy((prev: any) => ({
                  ...prev,
                  taskPriority: value.taskPriority,
                }));
              },
            }}
          />
        )}
      </TableCell>
      <TableCell className={styles.tableCell}>
        {selectedTaskOption.priorityType === "Script" && (
          <Tooltip title={translate("Script")} aria-label="enable">
            <div
              style={{ cursor: "pointer" }}
              onClick={() => {
                setFieldTypes("taskPriority");
                setActionDummy((prev: any) => ({
                  ...prev,
                  taskPriority: getScript("taskPriority"),
                }));
                setOpenScriptDialog(true);
              }}
            >
              <MaterialIcon icon="code" fontSize={20} />
            </div>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

export function DescriptionRow(props: any) {
  const {
    element,
    selectedTaskOption,
    setSelectedTaskOption,
    taskFields,
    setActionDummy,
    setFieldTypes,
    setProperty,
    getProperty,
    handleChange,
    getScript,
    filterTypes,
    setOpenScriptDialog,
    setOpenValueTextBox,
  } = props;
  return (
    <TableRow>
      <TableCell>
        <InputLabel className={styles.label}>{translate("Description")}</InputLabel>
      </TableCell>
      <TableCell>
        <Select
          className={styles.select}
          value={selectedTaskOption.descriptionType || null}
          type="text"
          options={filterTypes("field")}
          update={(value: any, _label: any) => {
            setSelectedTaskOption((prevState: any) => ({
              ...prevState,
              descriptionType: value?.title,
            }));
            const descriptionTypes = ["Value", "Field", "Script"];
            if (
              descriptionTypes.includes(selectedTaskOption.descriptionType) ||
              descriptionTypes.includes(getProperty("descriptionType"))
            ) {
              handleChange("description", null);
              setProperty("description", undefined);
              setProperty("descriptionType", undefined);
              setActionDummy((prev: any) => ({ ...prev, description: null }));
            }
          }}
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          disableClearable="false"
          isLabel={false}
          optionLabel={"title"}
        />
      </TableCell>
      <TableCell>
        <TextField
          className={styles.textbox}
          element={element}
          type="text"
          entry={{
            id: "description",
            name: "description",
            modelProperty: "description",
            get: function () {
              return { description: taskFields.description || "" };
            },
            set: function (e: any, value: any) {
              handleChange("description", value.description);
              setProperty("description", value.description);
              setProperty(
                "descriptionType",
                value?.description !== "" ? selectedTaskOption?.descriptionType : undefined,
              );
              setActionDummy((prev: any) => ({
                ...prev,
                description: value.description,
              }));
            },
          }}
          canRemove={true}
        />
      </TableCell>
      <TableCell className={styles.tableCell}>
        {selectedTaskOption.descriptionType === "Script" && (
          <Tooltip title={translate("Script")} aria-label="enable">
            <div
              style={{ cursor: "pointer" }}
              onClick={() => {
                setFieldTypes("description");
                setProperty("descriptionType", selectedTaskOption?.descriptionType);
                setActionDummy((prev: any) => ({
                  ...prev,
                  description: getScript("description"),
                }));
                setOpenScriptDialog(true);
              }}
            >
              <MaterialIcon icon="code" fontSize={20} />
            </div>
          </Tooltip>
        )}
        {selectedTaskOption.descriptionType === "Value" && (
          <Tooltip title={translate("Script")} aria-label="enable">
            <div
              style={{ cursor: "pointer" }}
              onClick={() => {
                setFieldTypes("description");
                setActionDummy((prev: any) => ({
                  ...prev,
                  description: getScript("description"),
                }));
                setOpenValueTextBox(true);
              }}
            >
              <MaterialIcon icon="edit" fontSize={20} />
            </div>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
