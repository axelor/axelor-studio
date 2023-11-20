import React from "react";
import { Button, Dialog, DialogTitle, makeStyles } from "@material-ui/core";
import { translate } from "../utils";

import ExpressionBuilder from "generic-builder/src/expression-builder";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    maxWidth: "100%",
    maxHeight: "100%",
    overflowY: "auto",
    resize: "both",
    minWidth: "70%",
    height: 650,
  },
  cancelButton: {
    margin: theme.spacing(1),
    backgroundColor: "#fff",
    borderColor: "#cccccc",
    textTransform: "capitalize",
    color: "#333333",
    "&:hover": {
      backgroundColor: "#e6e6e6",
      borderColor: "#adadad",
    },
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
    <Dialog
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          close();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">{translate(title)}</DialogTitle>
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
              variant="contained"
              size="small"
              className={classes.cancelButton}
            >
              {translate("Cancel")}
            </Button>
          }
        />
      ) : (
        <ExpressionBuilderDummy />
      )}
    </Dialog>
  );
}
export default QueryBuilder;
