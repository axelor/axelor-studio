import React from "react";
import { getAllModels, getMetaFields } from "@studio/shared/services";
import { FieldEditor } from "@studio/shared/properties";
import { Selection, AlertDialog, BooleanRadio } from "@studio/shared/components";
import { Box } from "@axelor/ui";

import styles from "./expression-dialog.module.css";
import type { MetaFieldInfo, ModelOption } from "../types";

interface ExpressionDialogBaseProps {
  open: boolean;
  onOk: () => void;
  onClose: () => void;
  contextModel: ModelOption | null;
  setContextModel: (value: ModelOption | null) => void;
  metaField: MetaFieldInfo | null | undefined;
  setMetaField: (value: MetaFieldInfo | null | undefined) => void;
  allFields: MetaFieldInfo[] | null;
  setAllFields: (value: MetaFieldInfo[] | null) => void;
  relationalField: MetaFieldInfo | null | undefined;
  setRelationalField: (value: MetaFieldInfo | null | undefined) => void;
  models: ModelOption[] | null;
  getData: (() => ModelOption[]) | null;
}

interface ExpressionDialogOutputProps extends ExpressionDialogBaseProps {
  mode: "output";
  valueFrom: string;
  setValueFrom: (value: string) => void;
  model: ModelOption | null;
  setModel: (value: ModelOption | null) => void;
  outputField: string | null;
  setOutputField: (value: string | null) => void;
}

interface ExpressionDialogInputProps extends ExpressionDialogBaseProps {
  mode: "input";
  field: string | null | false;
  setField: (value: string | null) => void;
}

type ExpressionDialogProps = ExpressionDialogOutputProps | ExpressionDialogInputProps;

export default function ExpressionDialog(props: ExpressionDialogProps) {
  const {
    open,
    onOk,
    onClose,
    contextModel,
    setContextModel,
    metaField: _metaField,
    setMetaField,
    allFields,
    setAllFields,
    relationalField: _relationalField,
    setRelationalField,
    models,
    getData,
    mode,
  } = props;

  const getModels = React.useCallback(async (e?: { search?: string }) => {
    const criteria: Array<Record<string, unknown>> = [];
    if (e?.search) {
      criteria.push({
        fieldName: "name",
        operator: "like",
        value: e.search,
      });
    }
    return getAllModels(e?.search ? { criteria } : undefined);
  }, []);

  const valueFrom = mode === "output" ? props.valueFrom : "context";

  const setFieldValue = (val: string | null) => {
    if (mode === "output") {
      props.setOutputField(val);
    } else {
      props.setField(val);
    }
  };

  const currentFieldValue =
    mode === "output" ? props.outputField : (props.field as string | null);

  const handleFieldEditorChange = (
    val: string | undefined,
    metaFieldArg: unknown,
    relationalFieldArg?: unknown,
  ) => {
    setFieldValue(val ?? null);
    setMetaField(metaFieldArg as MetaFieldInfo | null);
    const relArg = relationalFieldArg as MetaFieldInfo | null | undefined;
    const values = val ? val.split(".") : null;
    const newFields = [
      ...(allFields || []),
      metaFieldArg as MetaFieldInfo,
    ].filter(Boolean);
    const fields: MetaFieldInfo[] | null = values
      ? newFields.filter((f) => values.includes(f?.name || ""))
      : null;
    const isAvailable =
      fields && relArg && fields.find((f) => f?.name === relArg.name);
    if (isAvailable) {
      setRelationalField(relArg);
    } else {
      setRelationalField(null);
    }
    setAllFields(fields);
  };

  return (
    <AlertDialog
      openAlert={open}
      fullscreen={false}
      title="Expression"
      handleAlertOk={onOk}
      alertClose={onClose}
      children={
        <div className={styles.dialogContent}>
          {mode === "output" && (
            <BooleanRadio
              className={styles.contentRadio}
              name="radioType"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                props.setValueFrom(e?.target?.value)
              }
              data={[
                { value: "context", label: "Context" },
                { value: "model", label: "Model" },
              ]}
              value={valueFrom || "context"}
            />
          )}
          <Box d="flex" w={100} overflow="auto">
            {mode === "output" && valueFrom === "model" ? (
              <Selection
                name="model"
                title="Model"
                placeholder="Model"
                fetchAPI={async (e) => getModels(e)}
                optionLabelKey="name"
                onChange={(e: ModelOption | null) => {
                  props.setModel(e);
                  props.setOutputField(e ? e.name : null);
                }}
                value={props.model}
                classes={{ root: styles.MuiAutocompleteRoot }}
              />
            ) : (
              <React.Fragment>
                {models && models.length > 1 && (
                  <Selection
                    name="model"
                    title={mode === "output" ? "Context model" : "Model"}
                    placeholder={mode === "input" ? "Model" : undefined}
                    fetchAPI={async () => (getData ? getData() : [])}
                    optionLabelKey="name"
                    onChange={(e: ModelOption | null) => {
                      if (!e) {
                        setMetaField(null);
                        setRelationalField(null);
                        setAllFields(null);
                      }
                      setContextModel(e);
                      setFieldValue(null);
                    }}
                    value={contextModel}
                    classes={{ root: styles.MuiAutocompleteRoot }}
                  />
                )}
                <FieldEditor
                  getMetaFields={() => getMetaFields(contextModel)}
                  allowAllFields={true}
                  excludeUITypes={true}
                  onChange={handleFieldEditorChange}
                  value={{
                    fieldName: (currentFieldValue as string) || "",
                    allFields: (allFields || undefined) as unknown as undefined, // safety: builder allFields prop type differs from undefined literal
                  }}
                  isParent={true}
                />
              </React.Fragment>
            )}
          </Box>
        </div>
      }
    />
  );
}
