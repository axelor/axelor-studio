import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@axelor/ui";
import { DialogTitle } from "@material-ui/core";
import React, { useContext } from "react";
import { DialogContext } from "../../context/dialog-context";
import { translate } from "../../utils";
import styles from "./dialog-box.module.css";

const DialogBox = () => {
  const { open, title, message, onSave, onClose, dispatch } =
    useContext(DialogContext);
  const handleSave = () => {
    onSave();
    dispatch({
      type: "ON_SAVE",
    });
  };

  const handleClose = () => {
    onClose();
    dispatch({
      type: "ON_ClOSE",
    });
  };

  return (
    <Dialog centered backdrop open={open} className={styles.dialogPaper}>
      <DialogHeader onCloseClick={handleClose}>
        <DialogTitle className={styles.dialogTitle} >
          {translate(title)}
        </DialogTitle>
      </DialogHeader>
      <DialogContent d="flex" flexDirection="column">
        <Box as="p" color="body" fontSize={5}>
          {translate(message)}
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={handleClose}
        >
          {translate("Cancel")}
        </Button>
        <Button
          className={styles.save}
          variant="primary"
          onClick={handleSave}
        >
          {translate("OK")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default DialogBox;
