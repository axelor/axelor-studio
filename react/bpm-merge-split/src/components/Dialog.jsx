import React, { useState } from "react";
import {
  Button,
  Dialog as AxDialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import { translate } from "../utils";

const Dialog = ({
  title = "",
  onConfirm = () => {},
  onCancel = () => {},
  children,
  open,
  backdrop = true,
  ...rest
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <AxDialog backdrop open={!!open} onClose={handleClose} {...rest}>
      <DialogHeader onCloseClick={handleClose}>
        <DialogTitle>{translate(title)}</DialogTitle>
      </DialogHeader>
      <DialogContent>{children}</DialogContent>
      <DialogFooter>
        <Button autoFocus variant="primary" size="sm" onClick={handleConfirm}>
          {translate("OK")}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          {translate("Cancel")}
        </Button>
      </DialogFooter>
    </AxDialog>
  );
};

export default Dialog;
