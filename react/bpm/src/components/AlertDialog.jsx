import React from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@axelor/ui";

import { translate } from "../utils";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    margin: 20,
    maxHeight: "calc(100% - 40px)",
    maxWidth: "calc(100% - 40px)",
    display: "flex",
    "& > div": {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      "& > div": {
        maxWidth: "100%",
        maxHeight: "100%",
        resize: "both",
        overflow: "auto",
        minWidth: "50%",
      },
    },
  },
  save: {
    minWidth: 64,
    margin: theme.spacing(1),
    textTransform: "none",
  },
  content: {
    fontSize: 16,
    overflow: "hidden !important",
  },
}));

export default function AlertDialog({
  openAlert,
  alertClose,
  message,
  title,
  handleAlertOk,
  children,
  className,
}) {
  const classes = useStyles();
  return (
    <Dialog
      open={openAlert}
      fullscreen={children ? true : false}
      centered={children ? false : true}
      backdrop
      className={classnames(classes.dialogPaper, className)}
    >
      <DialogHeader onCloseClick={alertClose}>
        <h3>{translate(title)}</h3>
      </DialogHeader>
      <DialogContent className={classes.content}>
        {translate(message)}
        {children && <>{children}</>}
      </DialogContent>
      <DialogFooter>
        <Button
          onClick={handleAlertOk}
          className={classes.save}
          variant="primary"
        >
          {translate("OK")}
        </Button>
        <Button
          onClick={alertClose}
          className={classes.save}
          variant="secondary"
        >
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
