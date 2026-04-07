import React from "react";
import { Box, InputLabel } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import { Checkbox, SelectBox, TextField } from "../../../../../../components/properties/components";
import Select from "../../../../../../components/Select";
import { getDMNModels } from "../../../../../../shared/services";
import { openWebApp } from "../utils";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface DmnSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dmnModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDmnModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bindingType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setBindingType?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compulsory?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCompulsory?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleClickOpen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleClose?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConfirm?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateModel?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPropertyValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPropertyValue?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
}
import styles from "./service-task.module.css";
import { bindingOptions, getBusinessObject } from "./constants";

export default function DmnSection({
  element,
  dmnModel,
  setDmnModel,
  bindingType,
  setBindingType,
  compulsory,
  setCompulsory,
  open,
  handleClickOpen,
  handleClose,
  onConfirm,
  updateModel,
  getPropertyValue,
  setPropertyValue,
  setProperty,
}: DmnSectionProps) {
  return (
    <React.Fragment>
      <TextField
        element={element}
        entry={{
          id: "decisionRef",
          label: translate("Decision ref"),
          modelProperty: "decisionRef",
          get: function () {
            const bo = getBusinessObject(element);
            return { decisionRef: bo && bo.decisionRef };
          },
          set: function (e: any, values: any) {
            const value = values.decisionRef;
            const bo = getBusinessObject(element);
            if (bo) {
              bo.decisionRef = value;
              bo.class = undefined;
              bo.expression = undefined;
              bo.resultVariable = undefined;
              bo.delegateExpression = undefined;
              bo.topic = undefined;
            }
            updateModel(value);
          },
          validate: function (e, values) {
            if (!values.decisionRef) {
              return {
                decisionRef: translate("Must provide a value"),
              };
            }
          },
        }}
        canRemove={true}
        endAdornment={
          <Box className={styles.decisionRefIcons}>
            <div onClick={handleClickOpen} className={styles.link}>
              <MaterialIcon icon="add" fontSize={18} className={styles.linkIcon} />
            </div>
            {dmnModel &&
              element &&
              getBusinessObject(element)?.decisionRef && (
                <div
                  onClick={() => {
                    openWebApp(`dmn/?id=${dmnModel.id || ""}`, translate("DMN editor"));
                  }}
                  className={styles.link}
                >
                  <MaterialIcon icon="open_in_new" fontSize={18} className={styles.linkIcon} />
                </div>
              )}
          </Box>
        }
      />
      <TextField
        element={element}
        readOnly={true}
        entry={{
          id: "decisionName",
          label: translate("Decision name"),
          modelProperty: "decisionName",
          get: function () {
            const bo = getBusinessObject(element);
            return {
              decisionName: bo && bo.$attrs && bo.$attrs["camunda:decisionName"],
            };
          },
        }}
      />
      <SelectBox
        element={element}
        entry={{
          id: "decisionRefBinding",
          label: translate("Binding"),
          modelProperty: "decisionRefBinding",
          selectOptions: bindingOptions,
          emptyParameter: true,
          get: function () {
            return {
              decisionRefBinding: bindingType,
            };
          },
          set: function (e: any, values: any) {
            setBindingType(values.decisionRefBinding);
            setPropertyValue("decisionRefBinding", values.decisionRefBinding);
          },
        }}
      />
      {bindingType === "version" && (
        <TextField
          element={element}
          entry={{
            id: "decisionRefVersion",
            label: translate("Version"),
            modelProperty: "decisionRefVersion",
            get: function () {
              return {
                decisionRefVersion: getPropertyValue("decisionRefVersion"),
              };
            },
            set: function (e: any, values: any) {
              setPropertyValue("decisionRefVersion", values.decisionRefVersion);
              setPropertyValue("decisionRefVersionTag", undefined);
            },
            validate: function (e, values) {
              if (!values.decisionRefVersion) {
                return {
                  decisionRefVersion: translate("Must provide a value"),
                };
              }
            },
          }}
          canRemove={true}
        />
      )}
      {bindingType === "versionTag" && (
        <TextField
          element={element}
          entry={{
            id: "decisionRefVersionTag",
            label: translate("Version tag"),
            modelProperty: "decisionRefVersionTag",
            get: function () {
              const bo = getBusinessObject(element);
              return {
                decisionRefVersionTag: bo && bo.$attrs["camunda:decisionRefVersionTag"],
              };
            },
            set: function (e: any, values: any) {
              const bo = getBusinessObject(element);
              if (!bo) return;
              bo.$attrs["camunda:decisionRefVersionTag"] = values.decisionRefVersionTag;
              setPropertyValue("decisionRefVersion", undefined);
            },
            validate: function (e, values) {
              if (!values.decisionRefVersionTag) {
                return {
                  decisionRefVersionTag: translate("Must provide a value"),
                };
              }
            },
          }}
          canRemove={true}
        />
      )}
      <TextField
        element={element}
        entry={{
          id: "decisionRefTenantId",
          label: translate("Tenant id"),
          modelProperty: "decisionRefTenantId",
          get: function () {
            return {
              decisionRefTenantId: getPropertyValue("decisionRefTenantId"),
            };
          },
          set: function (e: any, values: any) {
            setPropertyValue("decisionRefTenantId", values.decisionRefTenantId);
          },
        }}
        canRemove={true}
      />
      <TextField
        element={element}
        entry={{
          id: "resultVariable",
          label: translate("Result variable"),
          modelProperty: "resultVariable",
          get: function () {
            const bo = getBusinessObject(element);
            const boResultVariable = bo && bo.resultVariable;
            return { resultVariable: boResultVariable };
          },
          set: function (e: any, values: any) {
            const bo = getBusinessObject(element);
            if (bo) {
              bo.resultVariable = values.resultVariable || undefined;
            }
          },
        }}
        canRemove={true}
      />
      <Checkbox
        element={element}
        entry={{
          id: "compulsory",
          label: translate("Compulsory"),
          modelProperty: "compulsory",
          widget: "checkbox",
          get: function () {
            return {
              compulsory: compulsory,
            };
          },
          set: function (e: any, value: any) {
            const compulsoryVal = !value.compulsory;
            setCompulsory(compulsoryVal);
            setProperty("compulsory", compulsoryVal);
          },
        }}
      />

      <AlertDialog
        openAlert={open}
        title={"Select DMN"}
        fullscreen={false}
        handleAlertOk={onConfirm}
        alertClose={handleClose}
        children={
          <div className={styles.dialogContent}>
            <InputLabel color="body" className={styles.label}>
              {translate("DMN")}
            </InputLabel>
            <Select
              className={styles.select}
              update={(value: any) => {
                setDmnModel(value);
              }}
              value={dmnModel}
              name="dmnModel"
              isLabel={true}
              fetchMethod={(options: any) => getDMNModels(options && options.criteria)}
              optionLabel={"name"}
              optionLabelSecondary={"decisionId"}
            />
          </div>
        }
      />
    </React.Fragment>
  );
}
