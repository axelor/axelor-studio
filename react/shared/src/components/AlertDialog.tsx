import React from "react";
import {
  Button,
  clsx,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@axelor/ui";

import { translate } from "../i18n/index";

import styles from "./alert-dialog.module.css";

interface AlertDialogProps {
  openAlert: boolean;
  alertClose: () => void;
  message?: string;
  title?: string;
  handleAlertOk: () => void;
  children?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  centered?: boolean;
}

export function AlertDialog({
  openAlert,
  alertClose,
  message,
  title = "",
  handleAlertOk,
  children,
  className,
  fullscreen = true,
  centered: _centered = false,
}: AlertDialogProps) {
  return (
    <Dialog
      open={openAlert}
      fullscreen={fullscreen && children ? true : false}
      centered
      backdrop
      className={clsx(styles.dialogPaper, className)}
    >
      <DialogHeader onCloseClick={alertClose}>
        <DialogTitle>{translate(title)}</DialogTitle>
      </DialogHeader>
      <DialogContent className={styles.content}>
        {message && translate(message)}
        {children && <>{children}</>}
      </DialogContent>
      <DialogFooter>
        <Button onClick={alertClose} className={styles.save} variant="secondary">
          {translate("Cancel")}
        </Button>
        <Button onClick={handleAlertOk} className={styles.save} variant="primary">
          {translate("OK")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
