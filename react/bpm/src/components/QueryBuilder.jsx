import React from "react";
import { translate } from "../utils";
import { Button, Dialog, DialogHeader, DialogContent } from "@axelor/ui";
import styles from "./QueryBuilder.module.css";

import ExpressionBuilder from "generic-builder/src/expression-builder";

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
  getExpression,
  fetchModels,
}) {
  const parameters = {
    type: type,
    withParam: true,
    isParameterShow: false,
  };
  return (
    <Dialog backdrop open={open} className={styles.dialog}>
      <DialogHeader onCloseClick={close}>
        <h3>{translate(title)}</h3>
      </DialogHeader>
      <DialogContent className={styles.dialogContent}>
        {ExpressionBuilder ? (
          <ExpressionBuilder
            parameters={parameters}
            isBPMN={true}
            isAllowButtons={true}
            close={close}
            setProperty={setProperty}
            getExpression={getExpression}
            defaultModel={defaultModel}
            fetchModels={fetchModels}
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
      </DialogContent>
    </Dialog>
  );
}
export default QueryBuilder;
