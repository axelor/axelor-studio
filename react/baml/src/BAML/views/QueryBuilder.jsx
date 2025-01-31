import React from 'react'
import { translate } from '../../utils'
import { Button, Dialog, DialogHeader, DialogContent } from "@axelor/ui";
import styles from "../css/queryBuilder.module.css";

import ExpressionBuilder from "generic-builder/src/views";

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
        <div>
        {ExpressionBuilder ? (

          <ExpressionBuilder
           open={open}
           title={title}
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
 </div>
  );
}
export default QueryBuilder;