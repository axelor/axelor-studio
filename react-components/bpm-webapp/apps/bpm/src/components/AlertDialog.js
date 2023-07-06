import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
} from "@material-ui/core";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import Box from "@material-ui/core/Box";
import CloseIcon from "@material-ui/icons/Close";

import { translate } from "../utils";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    padding: 5,
    minWidth: 300,
    overflow: "auto",
    resize: "both",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  title: {
    padding: "8px 24px",
    fontSize: 20.5,
    fontWeight: 600,
  },
  content: {
    paddingBottom: 48,
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
  hideAction = false,
}) {
  const classes = useStyles();
  return (
    <Dialog
      open={openAlert}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          alertClose(event);
        }
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      classes={{
        paper: classnames(classes.dialogPaper, className),
      }}
    >
      <DialogTitle id="alert-dialog-title" className={classes.title}>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>{translate(title)}</Box>
          {hideAction && (
            <Box>
              <IconButton size="small" onClick={alertClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </DialogTitle>
      <DialogContent className={hideAction ? classes.content : ""}>
        {message && (
          <DialogContentText id="alert-dialog-description">
            {translate(message)}
          </DialogContentText>
        )}
        {children && <>{children}</>}
      </DialogContent>
      {!hideAction && (
        <DialogActions>
          <Button onClick={handleAlertOk} className={classes.save}>
            {translate("OK")}
          </Button>
          <Button onClick={alertClose} className={classes.save}>
            {translate("Cancel")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
