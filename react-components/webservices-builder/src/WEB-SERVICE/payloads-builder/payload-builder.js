import React, { useEffect, useState } from 'react';
import {
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Add } from '@material-ui/icons';
import Line from '../components/Line';
import ModelPayload from './components/ModelPayload';

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'auto',
  },
  dialog:{
    width:'20%'
  },
  dialogPaper: {
  //  width: '100%',
    maxHeight: '80%',
    resize: 'both',
    minWidth: '70%',
    overflowY:'auto',
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
    'margin': theme.spacing(1),
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  baseModelParams: {
    display: 'flex',
    flexDirection: 'row',
  //  width: '100%',
  },
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '90%',
  },
  addBaseModelParams: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
   // width: '100%',
  },
  line: {
    width: '100px',
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'display': 'flex',
    'flexDirection': 'row',
    'alignItems': 'center',
    '& #simple-dialog-title': {
      cursor: 'pointer',
    },
  },
  scrollDiv: {
    //overflow: 'auto',
    height: 550,
  },
}));

function PayloadBuilder({
  onSave,
  initialData,
  handleClose,
  open,
  action,
}) {
  const classes = useStyles();
  const [modelPayloads, setModelPayloads] = useState([]);
  const [alertConfig, setAlertConfig] = React.useState({
    openAlert:false,
    alertMessage: 'Add all values',
    alertTitle: 'Error',
  });
  const handleSave = () => {
    if (!isAllFields()) setAlertConfig({...alertConfig,openAlert:true});
    else {
      onSave(modelPayloads);
      handleClose();
    }
  };

  const isAllFields = () => {
    let empty = true;
    modelPayloads.forEach((model) => {
      model.payloads.forEach((payload) => {
        if ((payload?.wsKey?.length === 0  || payload?.wsKey === null ) && (payload?.wsValue || payload?.wsValue) === null) {
          empty = false;
          return;
        }
      });
    });
    return empty;
  };

  const onCancel = () => {
    handleClose();
  };

  const handelAddModelPayload = () => {
    setModelPayloads([
      ...modelPayloads,
      {
        model: {},
        payloads: [
          {
            wsKey: null,
            wsValue: null,
            isList: false,
            subKeyValues: [],
            type: 'Basic',
          },
        ],
      },
    ]);
  };
  const handelDeleteModelPayload = (id) => {
    const newModelPayload = modelPayloads.filter(
      (modelPayload, index) => index !== id,
    );
    setModelPayloads(newModelPayload);
  };
  const addPayload = (id, payload) => {
    const newModelPayload = Object.assign([], modelPayloads);
    const b = Object.assign([], newModelPayload[id].payloads);
    b.push(payload);
    newModelPayload[id] = { ...newModelPayload[id], payloads: b };
    setModelPayloads(newModelPayload);
  };
  const addEmbeededPayload = (id, payload) => {
    const newModelPayload = Object.assign([], modelPayloads);
    const b = Object.assign([], newModelPayload[id].payloads);
    b.push(payload);
    newModelPayload[id] = { ...newModelPayload[id], payloads: b };
    setModelPayloads(newModelPayload);
  };
  const handleChangeModelPayload = (modelPayload, id) => {
    const newModelParam = [...modelPayloads];
    newModelParam[id] = modelPayload;
    setModelPayloads(newModelParam);
  };
  useEffect(() => {
    if (action === 'EDIT') {
      if (initialData?.length === 0) {
        setModelPayloads([
          {
            model: {},
            payloads: [
              { wsKey: null, wsValue: null, isList: false, type: 'Basic' },
            ],
          },
        ]);
      } else setModelPayloads(initialData);
    } else {
      setModelPayloads([
        {
          model: {},
          payloads: [
            { wsKey: null, wsValue: null, isList: false, type: 'Basic' },
          ],
        },
      ]);
    }
  }, [action, initialData]);

  return (
    <Dialog
      onClose={(e, reason) => {
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
      <DialogTitle id="simple-dialog-title">Build payloads</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div className={classes.baseModelParams}>
            <Line className={classes.line}></Line>
            <div className={classes.addBaseModelParams}>
              <div className={classes.dialogTitle}>
                <DialogTitle
                  id="simple-dialog-title"
                  className={classes.dialogTitle}
                  onClick={handelAddModelPayload}
                >
                  Add base model Payloads
                </DialogTitle>
                <Add />
              </div>
              <div className={classes.scrollDiv}>
                {modelPayloads?.map((modelPayload, index) => {
                  return (
                    <ModelPayload
                      handleChangePayload={handleChangeModelPayload}
                      addEmbeededPayload={addEmbeededPayload}
                      key={index}
                      addPayload={addPayload}
                      modelPayload={modelPayload}
                      deleteModelPayload={handelDeleteModelPayload}
                      id={index}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Paper>
        <div>
          <Button className={classes.save} onClick={handleSave}>
            OK
          </Button>
          <Button
            className={classes.save}
            onClick={onCancel}
            style={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        </div>
      </div>
      {alertConfig.openAlert && (
        <Dialog
          open={alertConfig.openAlert}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAlertConfig({...alertConfig,openAlert:false});
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {alertConfig.alertTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertConfig.alertMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAlertConfig({...alertConfig,openAlert:false});
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default PayloadBuilder;
