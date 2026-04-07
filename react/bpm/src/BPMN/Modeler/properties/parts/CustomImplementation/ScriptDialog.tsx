import React from "react";
import { AlertDialog } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import { Textbox } from "../../../../../components/properties/components";
import type { PropertiesPanelComponentProps } from "../../property-types";


interface ScriptDialogProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setActionDummy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionDummy?: any;
}
import styles from "./ScriptProps/script-props.module.css";


export default function ScriptDialog({
  element,
  setOpenScriptDialog,
  updateScript,
  fieldType,
  getProperty,
  setActionDummy,
  actionDummy,
}: ScriptDialogProps) {
  function getFieldPathValue(fieldType: any) {
    return actionDummy[fieldType] || "";
  }

  const scriptEntry = {
    id: "script",
    label: translate("Script"),
    modelProperty: "script",
    get: function () {
      return { script: getFieldPathValue(fieldType) };
    },
    set: function (e: any, values: any) {
      const updatedValue = values?.script;
      setActionDummy((_prev: any) => ({ [fieldType]: updatedValue }));
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
        <Textbox
          element={element}
          className={styles.textbox}
          readOnly={getProperty(`${fieldType}Value`)}
          showLabel={false}
          defaultHeight={window?.innerHeight - 205}
          entry={scriptEntry}
          suggestion={true}
        />
      }
    />
  );
}
