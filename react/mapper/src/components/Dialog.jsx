import React from 'react';
import { translate } from '../utils';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Button,
  Box,
} from '@axelor/ui';
import styles from './Dialog.module.css';

function DialogBox({ open, children, handleSave, handleClose }) {
  return (
    <Dialog fullscreen backdrop open={open} className={styles.dialogPaper}>
      <DialogHeader onCloseClick={handleClose}>
        <h3>{translate('Script')}</h3>
      </DialogHeader>
      <DialogContent d="flex" flexDirection="column">
        <Box shadow="md" bgColor="body" flex="1" overflow="auto">
          {children}
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="primary" className={styles.save} onClick={handleSave}>
          {translate('OK')}
        </Button>
        <Button
          variant="secondary"
          className={styles.save}
          onClick={handleClose}
        >
          {translate('Cancel')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default DialogBox;
