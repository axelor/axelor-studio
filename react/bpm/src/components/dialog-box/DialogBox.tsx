import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@axelor/ui";
import React from "react";
import { useDialogContext } from "@studio/shared/hooks";
import { translate } from "@studio/shared/i18n";

import styles from "./dialog-box.module.css";

const DialogBox = () => {
  const { open, title, message, onSave, onClose, dispatch } = useDialogContext();
  const handleSave = () => {
    onSave();
    dispatch({
      type: "ON_SAVE",
    });
  };

  const handleClose = () => {
    onClose();
    dispatch({
      type: "ON_CLOSE",
    });
  };

  return (
    <Dialog centered backdrop open={open} className={styles.dialogPaper}>
      <DialogHeader onCloseClick={handleClose}>
        <DialogTitle className={styles.dialogTitle}>{title ? translate(title) : ""}</DialogTitle>
      </DialogHeader>
      <DialogContent d="flex" flexDirection="column">
        <Box as="p" color="body" fontSize={5}>
          {message ? translate(message) : ""}
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={handleClose}>
          {translate("Cancel")}
        </Button>
        <Button className={styles.save} variant="primary" onClick={handleSave}>
          {translate("OK")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default DialogBox;
