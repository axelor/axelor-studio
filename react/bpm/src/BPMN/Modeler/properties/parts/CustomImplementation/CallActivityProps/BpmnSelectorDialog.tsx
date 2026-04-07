import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import React from "react";
import { InputLabel } from "@axelor/ui";
import { AlertDialog } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import Alert from "../../../../../../components/Alert";
import Select from "../../../../../../components/Select";
import { getBPMNModels } from "../../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface BpmnSelectorDialogProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleClose?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkfModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWkfModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateModelingProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openSnackbar?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSnackbarClose?: any;
}
import styles from "./callactivity.module.css";


export default function BpmnSelectorDialog({
  element,
  open,
  handleClose,
  wkfModel,
  setWkfModel,
  updateModelingProperty,
  openSnackbar,
  handleSnackbarClose,
}: BpmnSelectorDialogProps) {
  const onConfirm = () => {
    if (wkfModel) {
      if (element && getBusinessObject(element)) {
        getBusinessObject(element).calledElement = wkfModel.processId;
        updateModelingProperty("calledElement", wkfModel.processId);
      }
    }
    handleClose();
  };

  return (
    <>
      <AlertDialog
        openAlert={open}
        title={"Select BPMN"}
        handleAlertOk={onConfirm}
        alertClose={handleClose}
        fullscreen={false}
        children={
          <div>
            <InputLabel color="body" className={styles.label}>
              {translate("BPMN")}
            </InputLabel>
            <Select
              className={styles.select}
              update={(value: any) => {
                if (!value) return;
                setWkfModel({
                  ...value,
                  id: value.wkfModel?.id,
                  name: value.name,
                  processId: value.name || "",
                });
              }}
              value={wkfModel}
              name="wkfModel"
              fetchMethod={(options: any) => {
                return getBPMNModels({
                  data: {
                    criteria: [
                      {
                        fieldName: "wkfModel.statusSelect",
                        operator: "!=",
                        value: 3,
                      },
                      ...(options?.criteria || []),
                    ],
                  },
                });
              }}
              optionLabel={`wkfModel.name`}
              optionLabelSecondary={"name"}
            />
          </div>
        }
      />

      {openSnackbar.open && (
        <Alert
          open={openSnackbar.open}
          onClose={handleSnackbarClose}
          message={openSnackbar.message}
          messageType={openSnackbar.messageType}
        />
      )}
    </>
  );
}
