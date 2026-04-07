import React from "react";
import { translate } from "@studio/shared/i18n";
import {     Button } from "@axelor/ui";
import { ExpressionBuilder } from "generic-builder";

import styles from "./query-builder.module.css";

function ExpressionBuilderDummy() {
  return <p>Integrate Generic builder</p>;
}

interface QueryBuilderProps {
  open?: boolean;
  close?: () => void;
  title?: string;
  type?: string;
  defaultModel?: Record<string, unknown>;
  setProperty?: (value: Record<string, unknown>) => void;
  isCreateObject?: boolean;
  getExpression?: () => Record<string, unknown> | undefined;
  fetchModels?: () => Promise<unknown>;
  setOpen?: (open: boolean) => void;
  setOpenScriptDialog?: (open: boolean) => void;
}

function QueryBuilder({
  open,
  close,
  title = "Add expression",
  type,
  defaultModel,
  setProperty,
  isCreateObject,
  getExpression,
  fetchModels,
  setOpen,
  setOpenScriptDialog,
}: QueryBuilderProps) {
  const parameters = {
    type: type,
    withParam: true,
    isParameterShow: false,
  };

  return (
    <div>
      {ExpressionBuilder ? (
        <ExpressionBuilder
          open={open}
          title={title}
          parameters={parameters}
          isBPMN={true}
          isAllowButtons={true}
          close={close}
          setProperty={setProperty}
          getExpression={getExpression}
          defaultModel={defaultModel}
          fetchModels={fetchModels}
          setOpen={setOpen}
          isCreateObject={isCreateObject}
          setOpenScriptDialog={setOpenScriptDialog}
          dialogActionButton={
            <Button onClick={close} className={styles.cancelButton} variant="secondary">
              {translate("Cancel")}
            </Button>
          }
        />
      ) : (
        <ExpressionBuilderDummy />
      )}
    </div>
  );
}
export default QueryBuilder;
