import React from "react";
import AlertDialog from "../../../../../components/AlertDialog";
import { Textbox } from "../../../../../components/properties/components";
import { Box } from "@axelor/ui";
import { translate } from "../../../../../utils";
import styles from "./script-props.module.css";

export default function ScriptDialog({
  element,
  setOpenScriptDialog,
  updateScript,
  fieldType,
  getProperty,
  setActionDummy,
  actionDummy,
}) {
  function getFieldPathValue(fieldType) {
    return actionDummy[fieldType] || "";
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
      setActionDummy((prev)=>({[fieldType]:updatedValue}))
     
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
            readOnly={getProperty(`${fieldType}Value`)}
            showLabel={false}
            defaultHeight={window?.innerHeight - 205}
            entry={scriptEntry}
            suggestion={true}
          />
        </Box>
      }
    />
  );
}
