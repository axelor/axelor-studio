import React from "react";
import AlertDialog from "../../../../../components/AlertDialog";
import { Textbox } from "../../../../../components/properties/components";
import { Box } from "@axelor/ui";
import { translate } from "../../../../../utils";
import styles from "./ScriptProps.module.css";

export default function ScriptDialog({
  element,
  setOpenScriptDialog,
  updateScript,
  fieldType,
  userDummy,
  teamDummy,
  deadlineDummy,
  roleDummy,
  setUserFieldPathDummy,
  setTeamFieldDummy,
  setDeadlineFieldPathDummy,
  setRoleDummy,
  readOnlyFields,
  getProperty,
  actionTitleDummy,
  priorityDummy,
  durationDummy,
  descriptionDummy,
  setActionTitleDummy,
  setPriorityDummy,
  setDurationDummy,
  setDescriptionDummy,
}) {
  function getFieldPathValue(fieldType) {
    switch (fieldType) {
      case "userFieldPath":
        return userDummy?.userFieldPath;
      case "teamFieldPath":
        return teamDummy?.teamFieldPath;
      case "deadlineFieldPath":
        return deadlineDummy?.deadlineFieldPath;
      case "roleFieldPath":
        return roleDummy?.roleFieldPath;
      case "taskPriority":
        return priorityDummy?.taskPriority;
      case "taskName":
        return actionTitleDummy?.taskName;
      case "duration":
        return durationDummy?.duration;
      case "description":
        return descriptionDummy?.description;
      default:
        return "";
    }
  }

  const scriptEntry = {
    id: "script",
    label: translate("Script"),
    modelProperty: "script",
    get: function () {
      return { script: getFieldPathValue(fieldType) };
    },
    set: function (e, values) {
      const updatedValue = values?.script;
      if (fieldType === "userFieldPath") {
        setUserFieldPathDummy({ userFieldPath: updatedValue });
      } else if (fieldType === "teamFieldPath") {
        setTeamFieldDummy({ teamFieldPath: updatedValue });
      } else if (fieldType === "deadlineFieldPath") {
        setDeadlineFieldPathDummy({ deadlineFieldPath: updatedValue });
      } else if (fieldType === "roleFieldPath") {
        setRoleDummy({ roleFieldPath: updatedValue });
      } else if (fieldType === "taskPriority") {
        setPriorityDummy({ taskPriority: updatedValue });
      } else if (fieldType === "taskName") {
        setActionTitleDummy({ taskName: updatedValue });
      } else if (fieldType === "duration") {
        setDurationDummy({ duration: updatedValue });
      } else if (fieldType === "description") {
        setDescriptionDummy({ description: updatedValue });
      }
    },
  };

  const handleClose = () => {
    setOpenScriptDialog(false);
  };

  return (
    <AlertDialog
      className={styles.scriptDialog}
      openAlert={true}
      alertClose={handleClose}
      handleAlertOk={() => {
        updateScript(fieldType);
        setOpenScriptDialog(false);
      }}
      title={translate("Add script")}
      children={
        <Box color="body" className={styles.new}>
          <Textbox
            element={element}
            className={styles.textbox}
            readOnly={
              readOnlyFields[fieldType] || getProperty(`${fieldType}Value`)
            }
            showLabel={false}
            defaultHeight={window?.innerHeight - 205}
            entry={scriptEntry}
            language="groovy"
          />
        </Box>
      }
    />
  );
}
