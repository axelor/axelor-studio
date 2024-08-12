import React from "react";
import classnames from "classnames";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@axelor/ui";

import { translate } from "../utils";
import styles from "./alert-dialog.module.css";

export default function AlertDialog({
  openAlert,
  alertClose,
  message,
  title,
  handleAlertOk,
  children,
  className,
  fullscreen=true,
  centered=false
}) {
  return (
    <Dialog
      open={openAlert}
      fullscreen={fullscreen && children ? true : false}
      centered
      backdrop
      className={classnames(styles.dialogPaper, className)}
    >
      <DialogHeader onCloseClick={alertClose}>
        <DialogTitle>{translate(title)}</DialogTitle>
      </DialogHeader>
      <DialogContent className={styles.content}>
        {translate(message)}
        {children && <>{children}</>}
      </DialogContent>
      <DialogFooter>
        <Button
          onClick={alertClose}
          className={styles.save}
          variant="secondary"
        >
          {translate("Cancel")}
        </Button>
        <Button
          onClick={handleAlertOk}
          className={styles.save}
          variant="primary"
        >
          {translate("OK")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
