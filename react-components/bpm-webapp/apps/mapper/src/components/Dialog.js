import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  makeStyles,
  Paper,
} from '@material-ui/core';
import React from 'react';
import { translate } from '../utils';

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  dialogPaper: {
    maxWidth: '100%',
    maxHeight: '100%',
    resize: 'both',
    width: '100%',
    height: '90%',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: '100%',
    overflow: 'hidden',
  },
  save: {
    backgroundColor: '#0275d8',
    borderColor: '#0267bf',
    color: 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
}));

function DialogBox({ open, children, handleSave, handleClose }) {
  const classes = useStyles();
  return (
    <Dialog
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">{translate('Script')}</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div style={{ height: '100%', width: '100%' }}>{children}</div>
        </Paper>
        <DialogActions>
          <Button
            className={classes.save}
            onClick={handleSave}
            style={{ textTransform: 'none' }}
          >
            {translate('OK')}
          </Button>
          <Button
            className={classes.save}
            onClick={handleClose}
            style={{ textTransform: 'none' }}
          >
            {translate('Cancel')}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}

export default DialogBox;
