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
import styles from './dialog.module.css';

function DialogBox({
  open,
  title,
  children,
  handleSave,
  handleClose,
  fullscreen,
  className,
  isFooterShow = true,
}) {
  return (
    <Dialog
      {...(fullscreen && { fullscreen: fullscreen && children ? true : false })}
      backdrop
      open={open}
      className={className}
    >
      {title && (
        <DialogHeader onCloseClick={handleClose}>
          <h3>{translate(title)}</h3>
        </DialogHeader>
      )}
      <DialogContent d="flex" flexDirection="column">
        <Box shadow="md" bgColor="body" flex="1" overflow="auto">
          {children}
        </Box>
      </DialogContent>
      {isFooterShow && (
        <DialogFooter>
          <Button
            variant="secondary"
            className={styles.save}
            onClick={handleClose}
          >
            {translate('Cancel')}
          </Button>
          <Button
            variant="primary"
            className={styles.save}
            onClick={handleSave}
          >
            {translate('OK')}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}

export default DialogBox;
