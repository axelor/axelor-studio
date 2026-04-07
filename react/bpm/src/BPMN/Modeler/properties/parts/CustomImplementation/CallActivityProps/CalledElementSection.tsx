import React from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "@studio/shared/i18n";

import { TextField } from "../../../../../../components/properties/components";
import { openWebApp } from "../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface CalledElementSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callActivityType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wkfModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setWkfModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateModelingProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleClickOpen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNewBPMRecord?: any;
}
import styles from "./callactivity.module.css";

export default function CalledElementSection({
  element,
  callActivityType,
  wkfModel,
  setWkfModel,
  updateModel,
  updateModelingProperty,
  handleClickOpen,
  addNewBPMRecord,
}: CalledElementSectionProps) {
  if (callActivityType === "bpmn") {
    return (
      <TextField
        element={element}
        entry={{
          id: "calledElement",
          label: translate("Called element"),
          modelProperty: "calledElement",
          required: true,
          get: function () {
            const bo = getBusinessObject(element);
            return { calledElement: bo && bo.calledElement };
          },
          set: function (e: any, values: any) {
            if (!values.calledElement || values.calledElement === "") {
              setWkfModel(undefined);
            }
            getBusinessObject(element).calledElement = values.calledElement;
            updateModelingProperty("calledElement", values.calledElement);
            getBusinessObject(element).calledElementBinding = "latest";
            getBusinessObject(element).caseRef = undefined;
            updateModel(values.calledElement);
          },
          validate: function (e, values) {
            if (!values.calledElement && callActivityType === "bpmn") {
              return { calledElement: translate("Must provide a value") };
            }
          },
        }}
        canRemove={true}
        endAdornment={
          <>
            <Box color="body" onClick={handleClickOpen} className={styles.link}>
              <MaterialIcon icon="edit" fontSize={16} className={styles.linkIcon} />
            </Box>
            <Box color="body" onClick={addNewBPMRecord} className={styles.link}>
              <MaterialIcon icon="add" fontSize={16} className={styles.linkIcon} />
            </Box>
            {wkfModel && (
              <div
                onClick={() => {
                  openWebApp(`bpm/?id=${wkfModel.id || ""}`, translate("BPM editor"));
                }}
                className={styles.link}
              >
                <MaterialIcon fontSize={16} icon="open_in_new" className={styles.linkIcon} />
              </div>
            )}
          </>
        }
      />
    );
  }

  if (callActivityType === "cmmn") {
    return (
      <TextField
        element={element}
        entry={{
          id: "caseRef",
          label: translate("Case ref"),
          modelProperty: "caseRef",
          required: true,
          get: function () {
            const bo = getBusinessObject(element);
            return { caseRef: bo && bo.caseRef };
          },
          set: function (e: any, values: any) {
            getBusinessObject(element).caseRef = values.caseRef;
            getBusinessObject(element).calledElement = undefined;
            getBusinessObject(element).caseBinding = "latest";
          },
          validate: function (e, values) {
            if (!values.caseRef && callActivityType === "cmmn") {
              return { caseRef: translate("Must provide a value") };
            }
          },
        }}
        canRemove={true}
      />
    );
  }

  return null;
}
