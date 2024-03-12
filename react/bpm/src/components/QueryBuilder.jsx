import React from "react";
import { makeStyles } from "@material-ui/core";
import { translate } from "../utils";
import { Button, Dialog, DialogHeader, DialogContent } from "@axelor/ui";

import ExpressionBuilder from "generic-builder/src/expression-builder";

const useStyles = makeStyles((theme) => ({
  dialog: {
    margin: 20,
    display: "flex",
    maxHeight: "calc(100% - 40px)",
    maxWidth: "calc(100% - 40px)",
    "& > div": {
      maxWidth: "100%",
      minWidth: "70%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      "& > div": {
        maxHeight: "100%",
        resize: "both",
        overflow: "auto",
        minWidth: "80%",
        minHeight: "80%",
      },
    },
  },
  dialogContent: {
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  cancelButton: {
    minWidth: 64,
    margin: theme.spacing(1),
    textTransform: "none",
  },
}));

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
  const classes = useStyles();
  const parameters = {
    type: type,
    withParam: true,
    isParameterShow: false,
  };
  return (
    <Dialog backdrop open={open} className={classes.dialog}>
      <DialogHeader onCloseClick={close}>
        <h3>{translate(title)}</h3>
      </DialogHeader>
      <DialogContent className={classes.dialogContent}>
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
                className={classes.cancelButton}
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
