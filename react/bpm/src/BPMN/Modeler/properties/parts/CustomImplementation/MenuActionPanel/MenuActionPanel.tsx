import React, { useState, useEffect } from "react";
import { translate } from "@studio/shared/i18n";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  InputLabel,
  Box,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog, IconButton } from "@studio/shared/components";
import { useDialog } from "@studio/shared/hooks";

import Select from "../../../../../../components/Select";
import { Checkbox, Textbox } from "../../../../../../components/properties/components";
import { getTemplates } from "../../../../../../shared/services";
import { getBool } from "../../../../../../utils";
import ScriptDialog from "../ScriptDialog";
import type { PropertiesPanelComponentProps } from "../../../property-types";

import styles from "./menu-action.module.css";
import { PRIORITIES, TYPES } from "./constants";
import UserActionTable from "./UserActionTable";
import MenuCard from "./MenuCard";
import useMenuActions from "./useMenuActions";

export { createMenus } from "./constants";

export default function MenuActionPanel({
  element,
  bpmnFactory,
  bpmnModeler,
}: PropertiesPanelComponentProps) {
  const openDialog = useDialog();
  const {
    menus,
    model,
    metaModel,
    setProperty,
    getProperty,
    hasProperty,
    getScript,
    getSelectValue,
    updateMenuValue,
    getProcessConfig,
    getElements,
    updateContextElement,
    addContextElement,
    removeContextElement,
    addItems,
    removeItem,
    removeElement,
    updateValue,
    openMenu,
  } = useMenuActions({ element, bpmnFactory, bpmnModeler, openDialog });

  const [createUserAction, setCreateUserAction] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [emailEvent, setEmailEvent] = useState<{ id: unknown; name: unknown }>();
  const [openExpressionAlert, setExpressionAlert] = useState(false);
  const [alertMessage, _setAlertMessage] = useState<any>(null);
  const [actionDummy, setActionDummy] = useState({
    taskName: null,
    taskPriority: null,
    description: null,
  });
  const [taskFields, setTaskFields] = useState({
    taskName: null,
    taskPriority: null,
    duration: null,
  });
  const [fieldTypes, setFieldTypes] = useState<any>(null);
  const [selectedTaskOption, setSelectedTaskOption] = useState({
    taskNameType: "Value",
    priorityType: "Value",
    descriptionType: "Value",
  });
  const [openScriptDialog, setOpenScriptDialog] = useState(false);
  const [openValueTextBox, setOpenValueTextBox] = useState(false);

  const closeEditor = () => setOpenValueTextBox(false);

  const filterTypes = (type1: any, type2: any) => {
    const excludeValues = [type1, type2];
    return TYPES.filter((task) => !excludeValues.includes(task.value));
  };

  const handleChange = (name: any, value: any) => {
    setTaskFields((prevState) => ({ ...prevState, [name]: value }));
  };

  const formattedValue = (field: any) => {
    return field ? field.charAt(0).toUpperCase() + field.slice(1) : null;
  };

  const updateScript = (fieldType: any) => {
    const extractDummyField: Record<string, Record<string, unknown>> = {
      taskPriority: actionDummy,
      taskName: actionDummy,
      description: actionDummy,
    };
    const extractTypes: Record<string, string> = {
      taskName: "taskNameType",
      taskPriority: "priorityType",
      description: "descriptionType",
    };
    const propertiesType: Record<string, string> = {
      taskName: selectedTaskOption.taskNameType,
      taskPriority: selectedTaskOption.priorityType,
      description: selectedTaskOption.descriptionType,
    };
    const fieldPathDummy = extractDummyField[fieldType as string];
    if (!fieldPathDummy) return;
    if (fieldPathDummy[fieldType as string] === "") {
      setProperty(extractTypes[fieldType as string], undefined);
    } else {
      setProperty(extractTypes[fieldType as string], propertiesType[fieldType as string]);
    }
    const { [`${fieldType}Value`]: fieldPathValue, [`${fieldType}`]: fieldPath } =
      fieldPathDummy || {};
    if (fieldPath) {
      setTaskFields((prevState) => ({ ...prevState, [fieldType]: fieldPath }));
      setActionDummy((prev) => ({ ...prev, [fieldType]: fieldPath }));
      setProperty(fieldType, fieldPath);
      setProperty(`${fieldType}Value`, fieldPathValue);
    }
  };

  useEffect(() => {
    const userAction = getProperty("createUserAction");
    const taskName = getProperty("taskName");
    const emailNotification = getProperty("emailNotification");
    const emailEvent = {
      id: getProperty("emailEvent") || "start",
      name: getProperty("emailEventLabel") || translate("start"),
    };
    const template = getSelectValue("template");
    const descriptionField = getProperty("description");
    const isPriorityValid = PRIORITIES.some((p: any) => p.value === getProperty("taskPriority"));
    const priorityField = isPriorityValid
      ? formattedValue(getProperty("taskPriority"))
      : getProperty("taskPriority");
    setTaskFields((prev) => ({
      ...prev,
      taskName,
      taskPriority: priorityField,
      description: descriptionField,
    }));
    ["taskNameType", "priorityType", "descriptionType"].forEach((field: any) => {
      if (hasProperty(field)) {
        const val = formattedValue(getProperty(field));
        setSelectedTaskOption((prev) => ({ ...prev, [field]: val }));
      }
    });
    setCreateUserAction(getBool(userAction));
    setEmailNotification(getBool(emailNotification));
    setEmailEvent(emailEvent);
    setTemplate(template);
  }, [getProperty, getSelectValue, element]);

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <UserActionTable
          element={element}
          createUserAction={createUserAction}
          setCreateUserAction={setCreateUserAction}
          selectedTaskOption={selectedTaskOption}
          setSelectedTaskOption={setSelectedTaskOption}
          taskFields={taskFields}
          setTaskFields={setTaskFields}
          actionDummy={actionDummy}
          setActionDummy={setActionDummy}
          fieldTypes={fieldTypes}
          setFieldTypes={setFieldTypes}
          metaModel={metaModel}
          setProperty={setProperty}
          getProperty={getProperty}
          hasProperty={hasProperty}
          handleChange={handleChange}
          getScript={getScript}
          filterTypes={filterTypes}
          setOpenScriptDialog={setOpenScriptDialog}
          setOpenValueTextBox={setOpenValueTextBox}
        />
        <div className={styles.container}>
          <Checkbox
            element={element}
            entry={{
              id: "emailNotification",
              label: translate("Email notification"),
              modelProperty: "emailNotification",
              get: function () {
                return { emailNotification };
              },
              set: function (e: any, value: any) {
                setEmailNotification(!value.emailNotification);
                setProperty("emailNotification", !value.emailNotification);
                if (emailNotification === false) {
                  setTemplate(undefined);
                  setProperty("template", undefined);
                  updateMenuValue("emailEvent", undefined);
                  setEmailEvent(undefined);
                }
              },
            }}
          />
        </div>
        {emailNotification && (
          <Box
            flex={1}
            rounded={2}
            border
            bg="body-tertiary"
            color="body"
            style={{ width: "calc(100% - 20px)" }}
          >
            <Box color="body" style={{ padding: 10 }}>
              <React.Fragment>
                <InputLabel color="body" className={styles.label}>
                  {translate("Email event")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value: any, label: any) => {
                    setEmailEvent(value);
                    updateMenuValue("emailEvent", value, label, "id");
                  }}
                  options={[
                    { name: translate("start"), id: "start" },
                    { name: translate("end"), id: "end" },
                  ]}
                  isLabel={false}
                  disableClearable
                  name="emailEvent"
                  value={emailEvent || null}
                  optionLabel={"name"}
                />
              </React.Fragment>
              <React.Fragment>
                <InputLabel color="body" className={styles.label}>
                  {translate("Template")}
                </InputLabel>
                <Select
                  className={styles.select}
                  update={(value: any, label: any) => {
                    setTemplate(value);
                    updateMenuValue("template", value, label, "name");
                  }}
                  name="template"
                  value={template}
                  isLabel={false}
                  fetchMethod={() => getTemplates(getProcessConfig())}
                  optionLabel={"name"}
                />
              </React.Fragment>
            </Box>
          </Box>
        )}
        {openScriptDialog && (
          <ScriptDialog
            element={element}
            updateScript={updateScript}
            fieldType={fieldTypes}
            setOpenScriptDialog={setOpenScriptDialog}
            taskFields={taskFields}
            setTaskFields={setTaskFields}
            alertMessage={alertMessage}
            openExpressionAlert={openExpressionAlert}
            getScript={getScript}
            getProperty={getProperty}
            setProperty={setProperty}
            setActionDummy={setActionDummy}
            actionDummy={actionDummy}
          />
        )}
      </div>
      <div>
        <InputLabel color="body" className={styles.label}>
          {translate("Add menus")}
        </InputLabel>
        {menus?.map(
          (menu, key) =>
            menu && (
              <MenuCard
                key={`card_menu_${key}`}
                element={element}
                menu={menu}
                menuKey={key}
                model={model}
                updateValue={updateValue}
                removeItem={removeItem}
                removeElement={removeElement}
                openMenu={openMenu}
                getElements={getElements}
                updateContextElement={updateContextElement}
                addContextElement={addContextElement}
                removeContextElement={removeContextElement}
              />
            ),
        )}
        <Box d="flex" alignItems="center" color="body">
          <IconButton className={styles.iconButton} onClick={addItems}>
            <MaterialIcon icon="add" fontSize={16} />
          </IconButton>
        </Box>
      </div>

      <Dialog open={openExpressionAlert} backdrop centered className={styles.dialog}>
        <DialogHeader onCloseClick={() => setExpressionAlert(false)}>
          <h3>{translate("Error")}</h3>
        </DialogHeader>
        <DialogContent className={styles.content}>{translate(alertMessage)}</DialogContent>
        <DialogFooter>
          <Button
            onClick={() => setExpressionAlert(false)}
            variant="primary"
            className={styles.save}
          >
            {translate("OK")}
          </Button>
          <Button
            onClick={() => setExpressionAlert(false)}
            variant="secondary"
            className={styles.save}
          >
            {translate("Cancel")}
          </Button>
        </DialogFooter>
      </Dialog>

      {openValueTextBox && (
        <AlertDialog
          className={styles.scriptDialog}
          openAlert={true}
          alertClose={closeEditor}
          handleAlertOk={() => {
            updateScript(fieldTypes);
            setOpenValueTextBox(false);
          }}
          title={translate("Add description")}
          children={
            <Box color="body" className={styles.new}>
              <Textbox
                element={element}
                className={styles.textbox}
                showLabel={false}
                defaultHeight={window?.innerHeight - 205}
                entry={{
                  id: "script",
                  label: translate("Value"),
                  modelProperty: "script",
                  get: function () {
                    return { script: actionDummy?.description };
                  },
                  set: function (e: any, values: any) {
                    setActionDummy((prev) => ({ ...prev, description: values?.script }));
                  },
                }}
                suggestion={false}
              />
            </Box>
          }
        />
      )}
    </div>
  );
}
