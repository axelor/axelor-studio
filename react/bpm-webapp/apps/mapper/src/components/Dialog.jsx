import { makeStyles } from '@material-ui/core';
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

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    margin: 20,
    maxHeight: 'calc(100% - 40px)',
    maxWidth: 'calc(100% - 40px)',
    display: 'flex',
    '& > div': {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      '& > div': {
        maxWidth: '100%',
        maxHeight: '100%',
        resize: 'both',
        overflow: 'auto',
        minWidth: '50%',
      },
    },
  },
  save: {
    minWidth: 64,
    textTransform: 'none',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

function DialogBox({ open, children, handleSave, handleClose }) {
  const classes = useStyles();
  return (
    <Dialog fullscreen backdrop open={open} className={classes.dialogPaper}>
      <DialogHeader onCloseClick={handleClose}>
        <h3>{translate('Script')}</h3>
      </DialogHeader>
      <DialogContent d="flex" flexDirection="column">
        <Box shadow="md" bgColor="body" flex="1" overflow="auto">
          {children}
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="primary" className={classes.save} onClick={handleSave}>
          {translate('OK')}
        </Button>
        <Button
          variant="secondary"
          className={classes.save}
          onClick={handleClose}
        >
          {translate('Cancel')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default DialogBox;
