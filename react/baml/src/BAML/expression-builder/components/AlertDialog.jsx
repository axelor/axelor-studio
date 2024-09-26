import React from "react";
import classnames from "classnames";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@axelor/ui";

import { translate } from "../../../utils";
import styles from "../../css/AlertDialog.module.css";

export default function AlertDialog({
  openAlert,
  alertClose,
  message,
  title,
  handleAlertOk,
  children,
  fullscreen=false,
  className,
}) {
  return (
    <Dialog
      open={openAlert}
      fullscreen={fullscreen || children ? true : false}
      centered={children ? false : true}
      backdrop
      className={classnames(styles.dialogPaper, className)}
    >
      <DialogHeader onCloseClick={alertClose}>
        <h3>{translate(title)}</h3>
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
