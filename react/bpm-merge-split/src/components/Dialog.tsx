import React from "react";
import {
  Button,
  Dialog as AxDialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

interface DialogProps {
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  open: boolean;
  backdrop?: boolean;
}

const Dialog = ({
  title = "",
  onConfirm = () => {},
  onCancel = () => {},
  children,
  open,
  backdrop: _backdrop = true,
}: DialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <AxDialog backdrop open={!!open}>
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
