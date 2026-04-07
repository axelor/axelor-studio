/**
 * ExpressionBuilder UI component.
 */
import React, { useRef, useMemo } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Box,
  Input,
  InputLabel,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import ExpressionComponent from "../builder";
import {  Timeline, Button, Select, IconButton } from "../../components";
import { COMBINATOR as COMBINATORS } from "../../common/constants";
import { isBPMQuery, translate } from "../../common/utils";
import styles from "../index.module.css";
import { useDialog } from "../dialog-context";
import { createExpressionStore } from "../../stores/useExpressionStore";

import { generateExpression } from "./generate-expression";
import { useExpressionData } from "./useExpressionData";

interface ExpressionBuilderProps {
  open?: boolean;
  title?: string;
  parameters?: Record<string, unknown>;
  onSave?: (expr: unknown, values: unknown) => void;
  exprVal?: Record<string, unknown>;
  dialogActionButton?: React.ReactNode;
  isBPMN?: boolean;
  isCreateObject?: boolean;
  setProperty?: (val: Record<string, unknown>) => void;
  getExpression?: () => Record<string, unknown>;
  close?: () => void;
  defaultModel?: Record<string, unknown>;
  fetchModels?: (filter: unknown) => Promise<Record<string, unknown>[]>;
  isAllowButtons?: boolean;
  isMapper?: boolean;
  DialogBox?: React.ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
}

export default function ExpressionBuilder({
  open,
  title,
  parameters,
  onSave,
  exprVal,
  dialogActionButton,
  isBPMN = false,
  isCreateObject = true,
  setProperty,
  getExpression,
  close,
  defaultModel,
  fetchModels,
  isAllowButtons = false,
  isMapper,
}: ExpressionBuilderProps) {
  const {
    type: parentType = "expressionBuilder",
    id,
    model,
    resultField,
    resultMetaField,
    modelFilter,
    queryModel,
    withParam,
    isCondition,
    isPackage,
    isParameterShow = true,
  } = (parameters || {});
  const _expression = isBPMQuery(parentType as string) ? "BPM" : "GROOVY";

  const useStore = useMemo(() => createExpressionStore(), []);
  const combinator = useStore((s) => s.combinator);
  const setCombinator = useStore((s) => s.setCombinator);
  const expressionComponents = useStore((s) => s.expressionComponents);
  const setExpressionComponents = useStore((s) => s.setExpressionComponents);
  const record = useStore((s) => s.record);
  const setRecord = useStore((s) => s.setRecord);
  const openAlert = useStore((s) => s.openAlert);
  const setAlert = useStore((s) => s.setAlert);
  const defaultExpressionValue = useStore((s) => s.defaultExpressionValue);
  const setDefaultExpressionValue = useStore((s) => s.setDefaultExpressionValue);
  const singleResult = useStore((s) => s.singleResult);
  const setSingleResult = useStore((s) => s.setSingleResult);
  const generateWithId = useStore((s) => s.generateWithId);
  const setGenerateWithId = useStore((s) => s.setGenerateWithId);

  const counters = useRef({ paramCount: 0, count: 0 });

  const { DialogBox } = useDialog();

  useExpressionData({
    queryModel: queryModel as string,
    parentType: parentType as string,
    isPackage: isPackage as boolean,
    exprVal,
    getExpression,
    model: model as string,
    id: id as string,
    resultMetaField: resultMetaField as string,
    setExpressionComponents,
    setCombinator,
    setDefaultExpressionValue,
    setRecord,
    setSingleResult,
    setGenerateWithId,
  });

  function onAddExpressionEditor() {
    setExpressionComponents((draft) => {
      draft.push({
        value: isBPMQuery(parentType as string)
          ? queryModel && defaultExpressionValue
            ? (defaultExpressionValue as Record<string, unknown>)
            : {
                metaModals:
                  expressionComponents &&
                  expressionComponents[0] &&
                  expressionComponents[0].value &&
                  (expressionComponents[0].value).metaModals,
                rules: [
                  {
                    id: 0,
                    parentId: -1,
                    combinator: "and",
                    rules: [{}],
                  },
                ],
              }
          : undefined,
      });
    });
  }

  function onRemoveExpressionEditor(index: number) {
    setExpressionComponents((draft) => {
      draft.splice(index, 1);
    });
  }

  const onChange = React.useCallback(
    function onChange(value: unknown, index: number) {
      setExpressionComponents((draft) => {
        if (typeof value === "function") {
          !draft[index].value && (draft[index].value = {});
          (value as (v: Record<string, unknown>) => void)(
            draft[index].value,
          );
        } else {
          draft[index].value = value as Record<string, unknown>;
        }
      });
    },
    [setExpressionComponents],
  );

  function handleGenerate() {
    generateExpression({
      combinator,
      parentType: parentType as string,
      expressionComponents,
      isBPMN,
      isCreateObject,
      singleResult,
      generateWithId,
      isPackage: isPackage as boolean,
      isCondition: isCondition as boolean,
      withParam: withParam as boolean,
      queryModel: queryModel as string,
      counters: counters.current,
      setAlert,
      model: model as string,
      record,
      resultField: resultField as string,
      resultMetaField: resultMetaField as string,
      onSave,
      setProperty,
      close,
    });
  }

  const renderCheckbox = (
    label: string,
    checked: boolean,
    onCheckChange: (val: boolean) => void,
  ) => (
    <Box d="flex" alignItems="center" gap={8} style={{ padding: 9 }}>
      <Input
        type="checkbox"
        checked={checked}
        id={label}
        style={{ fontSize: 16 }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCheckChange(e.target.checked)}
      />
      <InputLabel style={{ margin: 0 }} htmlFor={label}>
        {translate(label)}
      </InputLabel>
    </Box>
  );

  function UI() {
    return (
      <div>
        <Button
          title={isBPMQuery(parentType as string) ? "Add group" : "Add expression"}
          icon="add"
          onClick={() => onAddExpressionEditor()}
          disabled={
            isBPMQuery(parentType as string)
              ? expressionComponents &&
                ((expressionComponents[0] &&
                  expressionComponents[0].value &&
                  (expressionComponents[0].value).metaModals) ||
                  expressionComponents.length === 0)
                ? false
                : true
              : false
          }
        />
        {expressionComponents &&
          expressionComponents.map(({ value }, index) => {
            return (
              <Box d="flex" alignItems="center" key={index}>
                <ExpressionComponent
                  value={value}
                  index={index}
                  onChange={onChange}
                  element={
                    record &&
                    modelFilter &&
                    (record)[modelFilter as string]
                  }
                  type={parentType as string}
                  queryModel={queryModel as string}
                  isCondition={isCondition as boolean}
                  isPackage={isPackage as boolean}
                  isParameterShow={isParameterShow as boolean}
                  defaultModel={defaultModel}
                  fetchModels={fetchModels}
                  isAllowButtons={isAllowButtons}
                  isBPMN={isBPMN}
                  isMapper={isMapper}
                />

                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onRemoveExpressionEditor(index)}
                >
                  {" "}
                  <div></div>
                  <MaterialIcon icon="delete" fontSize={18} color="body" />
                </IconButton>
              </Box>
            );
          })}
      </div>
    );
  }

  return (
    <DialogBox
      fullscreen={true}
      open={open ?? false}
      title={title}
      isFooterShow={false}
      handleClose={close}
      className={styles.dialogPaper}
      children={
        <Box d="flex" flexDirection="column" overflow="hidden" flex="1">
          <Box d="flex" flexDirection="column" color="body" className={styles.root}>
            <Box rounded={2} border={true} className={styles.paper}>
              <Box maxH={100} maxW={100}>
                {isBPMN &&
                  !isBPMQuery(parentType as string) &&
                  renderCheckbox("Generate with saved record", generateWithId, setGenerateWithId)}
                {isBPMN &&
                  isBPMQuery(parentType as string) &&
                  renderCheckbox("Single result", singleResult, setSingleResult)}
                <Timeline
                  isBPMN={isBPMN}
                  title={
                    <Select
                      className={styles.combinator}
                      name="expression"
                      value={combinator}
                      options={COMBINATORS}
                      onChange={(value: unknown) => setCombinator((value as string) || "and")}
                      disableUnderline={true}
                    />
                  }
                >
                  {UI()}
                </Timeline>
              </Box>
            </Box>
          </Box>

          <Box className={styles.dialogFooter}>
            <Button
              variant="primary"
              title="OK"
              className={styles.save}
              onClick={() => handleGenerate()}
            />
            {dialogActionButton && <React.Fragment>{dialogActionButton}</React.Fragment>}
          </Box>

          <Dialog centered open={openAlert} className={styles.dialog}>
            <DialogHeader onCloseClick={() => setAlert(false)}>
              <h3>{translate("Error")}</h3>
            </DialogHeader>
            <DialogContent className={styles.dialogContent}>
              {translate("Add all values")}
            </DialogContent>
            <DialogFooter>
              <Button variant="primary" title="OK" onClick={() => setAlert(false)} />
            </DialogFooter>
          </Dialog>
        </Box>
      }
    />
  );
}
