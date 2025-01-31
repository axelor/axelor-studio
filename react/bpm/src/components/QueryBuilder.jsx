import React from "react";
import { translate } from "../utils";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@axelor/ui";
import ExpressionBuilder from "generic-builder/src/views";
import styles from "./query-builder.module.css";

function ExpressionBuilderDummy() {
  return <p>Integrate Generic builder</p>;
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
}) {
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
          setOpenScriptDialog={setOpenScriptDialog}
          dialogActionButton={
            <Button
              onClick={close}
              className={styles.cancelButton}
              variant="secondary"
            >
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
