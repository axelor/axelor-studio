import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import React from "react";
import { BootstrapIcon } from "@axelor/ui/icons/bootstrap-icon";
import { Badge } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { AlertDialog, Tooltip  } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

import ConnectorBuilder from "../../../../connector-builder";
import Mapper from "../../../../../../components/Mapper";
import QueryBuilder from "../../../../../../components/QueryBuilder";
import { Textbox } from "../../../../../../components/properties/components";
import { fetchModels } from "../../../../../../shared/services";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ScriptEditorSectionProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isReadOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setReadOnly?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openMapper?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMapper?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openConnector?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenConnector?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpenScriptDialog?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  script?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateScript?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProperty?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getter?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog?: any;
}
import styles from "./script-props.module.css";

const implementationOptions = [
  { name: translate("Script"), value: "script" },
  { name: translate("Request"), value: "request" },
  {
    name: translate("Connector"),
    value: "connector",
  },
];

export default function ScriptEditorSection({
  element,
  type,
  isReadOnly,
  setReadOnly,
  open,
  setOpen,
  openMapper,
  setMapper,
  openConnector,
  setOpenConnector,
  openScriptDialog,
  setOpenScriptDialog,
  script,
  setScript,
  bpmnModeler,
  getScript,
  updateScript,
  setProperty,
  getProperty,
  getter,
  openDialog,
}: ScriptEditorSectionProps) {
  const handleClickOpen = () => {
    setMapper(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMapperOpen = () => {
    setOpen(false);
    setMapper(true);
  };

  const handleCloseMapper = () => {
    setMapper(false);
  };

  const onSave = (expr: any) => {
    const { resultField, resultMetaField } = expr || {};
    getBusinessObject(element).script = resultField;
    getBusinessObject(element).scriptFormat = "axelor";
    setProperty("scriptValue", resultField ? resultMetaField : undefined);
    handleCloseMapper();
  };

  const getExpression = () => {
    return {
      resultField: element && getBusinessObject(element) && getBusinessObject(element).script,
      resultMetaField: getProperty("scriptValue"),
    };
  };

  const setter = (val: any) => {
    const { expression, value, combinator, checked } = val;
    getBusinessObject(element).script = expression;
    getBusinessObject(element).scriptFormat = "axelor";
    if (expression === "" || expression === null || expression === undefined) {
      setProperty("scriptValue", undefined);
      setProperty("scriptOperatorType", undefined);
    }
    if (value) {
      (value || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
      setProperty("scriptValue", value);
      setReadOnly(true);
    }
    setProperty("scriptOperatorType", combinator);
    setProperty("checked", checked);
  };

  return (
    <div className={styles.expressionBuilder}>
      <Textbox
        element={element}
        className={styles.textbox}
        rows={3}
        readOnly={isReadOnly}
        minimap={false}
        entry={{
          id: "script",
          // @ts-expect-error -- safety: bpmn-js element union type incompatible with narrower prop type
          label: (
            <div className={styles.script}>
              <div>{translate("Script")}</div>
              <div style={{ display: "flex" }}>
                <Badge m={1} bgColor="secondary" rounded="pill" style={{ fontSize: 12 }}>
                  {implementationOptions?.find((i) => i?.value === type)?.name}
                </Badge>
                <Badge
                  m={1}
                  bgColor={isReadOnly ? "success" : "primary"}
                  rounded="pill"
                  style={{ fontSize: 12 }}
                >
                  {isReadOnly ? translate("Generated") : translate("Manually edited")}
                </Badge>
              </div>
            </div>
          ),
          modelProperty: "script",
          get: function () {
            return getScript();
          },
          set: function (e: any, values: any) {
            !isReadOnly && updateScript({ expr: values?.script });
          },
          validate: function (e: any, values: any) {
            if (!values.script) {
              return { script: translate("Must provide a value") };
            }
          },
        }}
      />
      <div className={styles.new}>
        <Tooltip title={translate("Enable")} aria-label="enable">
          <BootstrapIcon
            icon="code-slash"
            fontSize={18}
            onClick={() => {
              if (isReadOnly) {
                openDialog({
                  title: "Warning",
                  message: "Script can't be managed using builder once changed manually.",
                  onSave: () => {
                    setReadOnly(false);
                    setOpenScriptDialog(true);
                    setScript(getScript()?.script);
                    if (getBusinessObject(element)) {
                      setProperty("scriptOperatorType", undefined);
                      setProperty("scriptValue", undefined);
                    }
                  },
                });
              } else {
                setScript(getScript()?.script);
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
            type === "connector"
              ? setOpenConnector(true)
              : type === "request"
                ? handleClickOpen()
                : handleMapperOpen();
          }}
        />
        {type === "connector"
          ? openConnector && (
              <ConnectorBuilder
                open={openConnector}
                handleClose={() => {
                  setOpenConnector(false);
                }}
                updateScript={(val) => {
                  updateScript(val);
                  setReadOnly(true);
                }}
                getDefaultValues={() => getProperty("scriptValue")}
              />
            )
          : type === "request"
            ? open && (
                <QueryBuilder
                  open={open}
                  close={handleClose}
                  type="bpmQuery"
                  title="Add query"
                  setProperty={setter}
                  getExpression={getter}
                  fetchModels={() => fetchModels(element)}
                />
              )
            : openMapper && (
                <Mapper
                  open={openMapper}
                  handleClose={handleCloseMapper}
                  onSave={(expr: any) => {
                    onSave(expr);
                    if (expr && expr.resultField) {
                      setReadOnly(true);
                    } else {
                      setReadOnly(false);
                    }
                  }}
                  params={() => getExpression()}
                  bpmnModeler={bpmnModeler}
                  // @ts-expect-error -- safety: bpmn-js element is BpmnElement at this call site
                  element={element}
                />
              )}
        {openScriptDialog && (
          <AlertDialog
            className={styles.scriptDialog}
            openAlert={openScriptDialog}
            alertClose={() => setOpenScriptDialog(false)}
            handleAlertOk={() => {
              updateScript({ expr: script });
              setOpenScriptDialog(false);
            }}
            title={translate("Add script")}
            children={
              <Textbox
                element={element}
                className={styles.textbox}
                showLabel={false}
                defaultHeight={window?.innerHeight - 205}
                entry={{
                  id: "script",
                  label: translate("Script"),
                  modelProperty: "script",
                  get: function () {
                    return { script };
                  },
                  set: function (e: any, values: any) {
                    setScript(values?.script);
                  },
                }}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
