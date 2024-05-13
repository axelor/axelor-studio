import React from 'react'
import { translate } from '../../utils'
import { Button, Dialog, DialogHeader, DialogContent } from "@axelor/ui";
import styles from "../css/queryBuilder.module.css";

import ExpressionBuilder from "generic-builder/src/expression-builder";

function ExpressionBuilderDummy() {
  return <p>Integrate Generic builder</p>;
}


const QueryBuilder = ({
  open,
  close,
  title = "Add expression",
  type,
  defaultModel,
  setProperty,
  getExpression,
  isBPMN=true,
  isBamlQuery=false
}) => {
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
            isBPMN={isBPMN}
            isBamlQuery={isBamlQuery}
            isAllowButtons={true}
            close={close}
            setProperty={setProperty}
            getExpression={getExpression}
            defaultModel={defaultModel}
            dialogActionButton={
              <Button
                onClick={close}
                className={styles.cancelButton}
                variant="secondary"
              >
                {translate("Cancel")}
              </Button>
            }
          />) : (
          <ExpressionBuilderDummy />
        )}
      </DialogContent>
    </Dialog>
  );
}
export default QueryBuilder;